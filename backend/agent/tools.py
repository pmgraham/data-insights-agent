"""Custom tools for the Data Insights Agent."""

from typing import Any
from google.cloud import bigquery
from .config import settings


# Cache for schema information to improve response times
_schema_cache: dict[str, dict] = {}


def get_available_tables() -> dict[str, Any]:
    """
    Get a list of all available tables in the configured BigQuery dataset
    with their descriptions and column information.

    Returns:
        dict: A dictionary containing:
            - status: "success" or "error"
            - dataset: The dataset name
            - tables: List of table information including name, description, and columns
    """
    try:
        client = bigquery.Client(project=settings.google_cloud_project)
        dataset_ref = f"{settings.google_cloud_project}.{settings.bigquery_dataset}"

        tables = list(client.list_tables(dataset_ref))
        table_info = []

        for table in tables:
            full_table_id = f"{dataset_ref}.{table.table_id}"

            # Check cache first
            if full_table_id in _schema_cache:
                table_info.append(_schema_cache[full_table_id])
                continue

            # Get detailed table info
            table_ref = client.get_table(full_table_id)
            columns = [
                {
                    "name": field.name,
                    "type": field.field_type,
                    "description": field.description or "",
                    "mode": field.mode
                }
                for field in table_ref.schema
            ]

            info = {
                "name": table.table_id,
                "full_name": full_table_id,
                "description": table_ref.description or "",
                "num_rows": table_ref.num_rows,
                "columns": columns
            }

            # Cache the result
            _schema_cache[full_table_id] = info
            table_info.append(info)

        return {
            "status": "success",
            "dataset": settings.bigquery_dataset,
            "tables": table_info
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


def get_table_schema(table_name: str) -> dict[str, Any]:
    """
    Get detailed schema information for a specific table.

    Args:
        table_name: The name of the table (can be just the table name or fully qualified)

    Returns:
        dict: A dictionary containing:
            - status: "success" or "error"
            - table_name: The table name
            - columns: List of column details
            - sample_values: Sample values for each column (for context)
    """
    try:
        client = bigquery.Client(project=settings.google_cloud_project)

        # Handle both simple and fully qualified table names
        if "." not in table_name:
            full_table_id = f"{settings.google_cloud_project}.{settings.bigquery_dataset}.{table_name}"
        else:
            full_table_id = table_name

        table_ref = client.get_table(full_table_id)

        columns = []
        for field in table_ref.schema:
            col_info = {
                "name": field.name,
                "type": field.field_type,
                "description": field.description or "",
                "mode": field.mode,
                "is_nullable": field.mode != "REQUIRED"
            }
            columns.append(col_info)

        # Get sample values for context (limited query)
        sample_query = f"SELECT * FROM `{full_table_id}` LIMIT 5"
        sample_results = client.query(sample_query).result()
        sample_rows = [dict(row) for row in sample_results]

        return {
            "status": "success",
            "table_name": table_name,
            "full_table_id": full_table_id,
            "description": table_ref.description or "",
            "num_rows": table_ref.num_rows,
            "columns": columns,
            "sample_rows": sample_rows
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


def validate_sql_query(sql: str) -> dict[str, Any]:
    """
    Validate a SQL query without executing it using BigQuery's dry run feature.
    This helps catch errors before running potentially expensive queries.

    Args:
        sql: The SQL query to validate

    Returns:
        dict: A dictionary containing:
            - status: "valid" or "invalid"
            - estimated_bytes: Estimated bytes to be processed (if valid)
            - error: Error message (if invalid)
    """
    try:
        client = bigquery.Client(project=settings.google_cloud_project)

        job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
        query_job = client.query(sql, job_config=job_config)

        # Convert bytes to human-readable format
        bytes_processed = query_job.total_bytes_processed
        if bytes_processed < 1024:
            size_str = f"{bytes_processed} B"
        elif bytes_processed < 1024 * 1024:
            size_str = f"{bytes_processed / 1024:.2f} KB"
        elif bytes_processed < 1024 * 1024 * 1024:
            size_str = f"{bytes_processed / (1024 * 1024):.2f} MB"
        else:
            size_str = f"{bytes_processed / (1024 * 1024 * 1024):.2f} GB"

        return {
            "status": "valid",
            "estimated_bytes": bytes_processed,
            "estimated_size": size_str,
            "message": f"Query is valid. Estimated data to process: {size_str}"
        }
    except Exception as e:
        return {
            "status": "invalid",
            "error": str(e)
        }


def execute_query_with_metadata(sql: str, max_rows: int = 1000) -> dict[str, Any]:
    """
    Execute a SQL query and return results with metadata for the frontend.

    Args:
        sql: The SQL query to execute
        max_rows: Maximum number of rows to return (default 1000)

    Returns:
        dict: A dictionary containing:
            - status: "success" or "error"
            - columns: List of column names and types
            - rows: The query results as a list of dictionaries
            - total_rows: Total rows in result
            - query_time_ms: Query execution time in milliseconds
            - sql: The executed SQL query
    """
    try:
        client = bigquery.Client(project=settings.google_cloud_project)

        # Add LIMIT if not present and max_rows is specified
        sql_lower = sql.lower().strip()
        if "limit" not in sql_lower and max_rows:
            sql = f"{sql.rstrip(';')} LIMIT {max_rows}"

        import time
        start_time = time.time()
        query_job = client.query(sql)
        results = query_job.result()
        end_time = time.time()

        # Extract column information
        columns = [
            {
                "name": field.name,
                "type": field.field_type
            }
            for field in results.schema
        ]

        # Convert rows to list of dicts, handling special types
        rows = []
        for row in results:
            row_dict = {}
            for key, value in row.items():
                # Convert non-serializable types to strings
                if hasattr(value, 'isoformat'):
                    row_dict[key] = value.isoformat()
                elif isinstance(value, bytes):
                    row_dict[key] = value.decode('utf-8', errors='replace')
                else:
                    row_dict[key] = value
            rows.append(row_dict)

        return {
            "status": "success",
            "columns": columns,
            "rows": rows,
            "total_rows": len(rows),
            "query_time_ms": round((end_time - start_time) * 1000, 2),
            "sql": sql
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "sql": sql
        }


def clear_schema_cache() -> dict[str, str]:
    """
    Clear the cached schema information. Useful when table structures change.

    Returns:
        dict: Status message
    """
    global _schema_cache
    count = len(_schema_cache)
    _schema_cache = {}
    return {
        "status": "success",
        "message": f"Cleared {count} cached table schemas"
    }


# List of all tools to be registered with the agent
CUSTOM_TOOLS = [
    get_available_tables,
    get_table_schema,
    validate_sql_query,
    execute_query_with_metadata,
    clear_schema_cache
]
