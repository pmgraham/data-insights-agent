#!/usr/bin/env python3
"""Script to run the Data Insights Agent backend."""

import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    from agent.config import settings

    print("=" * 50)
    print("Data Insights Agent Backend")
    print("=" * 50)
    print(f"Project: {settings.google_cloud_project}")
    print(f"Dataset: {settings.bigquery_dataset}")
    print(f"Region: {settings.google_cloud_region}")
    print(f"Server: http://{settings.host}:{settings.port}")
    print(f"Docs: http://{settings.host}:{settings.port}/docs")
    print("=" * 50)

    uvicorn.run(
        "api.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
