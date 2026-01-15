import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import type { ChartType, QueryResult } from '../types';

interface UseChartConfigOptions {
  queryResult: QueryResult;
  chartType: ChartType;
  xAxisColumn?: string;
  yAxisColumn?: string;
}

export function useChartConfig({
  queryResult,
  chartType,
  xAxisColumn,
  yAxisColumn,
}: UseChartConfigOptions): EChartsOption | null {
  return useMemo(() => {
    if (!queryResult || chartType === 'table' || queryResult.rows.length === 0) {
      return null;
    }

    const { columns, rows } = queryResult;

    // Auto-detect x and y columns if not specified
    const numericColumns = columns.filter((col) =>
      ['INTEGER', 'FLOAT', 'NUMERIC', 'INT64', 'FLOAT64', 'BIGNUMERIC'].includes(col.type.toUpperCase())
    );
    const stringColumns = columns.filter((col) =>
      ['STRING', 'DATE', 'DATETIME', 'TIMESTAMP'].includes(col.type.toUpperCase())
    );

    const xCol = xAxisColumn || stringColumns[0]?.name || columns[0]?.name;
    const yCol = yAxisColumn || numericColumns[0]?.name || columns[1]?.name;

    if (!xCol || !yCol) {
      return null;
    }

    // Extract data
    const xData = rows.map((row) => String(row[xCol] ?? ''));
    const yData = rows.map((row) => Number(row[yCol] ?? 0));

    // Base options
    const baseOptions: EChartsOption = {
      tooltip: {
        trigger: chartType === 'pie' ? 'item' : 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      color: [
        '#3b82f6', // blue
        '#10b981', // emerald
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#84cc16', // lime
      ],
    };

    switch (chartType) {
      case 'bar':
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: xData,
            axisLabel: {
              rotate: xData.length > 10 ? 45 : 0,
              interval: 0,
            },
          },
          yAxis: {
            type: 'value',
            name: yCol,
          },
          series: [
            {
              name: yCol,
              type: 'bar',
              data: yData,
              itemStyle: {
                borderRadius: [4, 4, 0, 0],
              },
            },
          ],
        };

      case 'line':
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: xData,
            boundaryGap: false,
          },
          yAxis: {
            type: 'value',
            name: yCol,
          },
          series: [
            {
              name: yCol,
              type: 'line',
              data: yData,
              smooth: true,
              symbol: 'circle',
              symbolSize: 6,
            },
          ],
        };

      case 'area':
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: xData,
            boundaryGap: false,
          },
          yAxis: {
            type: 'value',
            name: yCol,
          },
          series: [
            {
              name: yCol,
              type: 'line',
              data: yData,
              smooth: true,
              areaStyle: {
                opacity: 0.3,
              },
              symbol: 'circle',
              symbolSize: 6,
            },
          ],
        };

      case 'pie':
        const pieData = rows.map((row) => ({
          name: String(row[xCol] ?? ''),
          value: Number(row[yCol] ?? 0),
        }));

        return {
          ...baseOptions,
          series: [
            {
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: true,
              itemStyle: {
                borderRadius: 4,
                borderColor: '#fff',
                borderWidth: 2,
              },
              label: {
                show: true,
                formatter: '{b}: {d}%',
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 14,
                  fontWeight: 'bold',
                },
              },
              data: pieData,
            },
          ],
        };

      default:
        return null;
    }
  }, [queryResult, chartType, xAxisColumn, yAxisColumn]);
}
