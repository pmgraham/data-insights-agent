import ReactECharts from 'echarts-for-react';
import type { ChartType, QueryResult } from '../../types';
import { useChartConfig } from '../../hooks/useChartConfig';

interface ChartViewProps {
  queryResult: QueryResult;
  chartType: ChartType;
}

export function ChartView({ queryResult, chartType }: ChartViewProps) {
  const chartOptions = useChartConfig({
    queryResult,
    chartType,
  });

  if (!chartOptions) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <p>Cannot display this data as a {chartType} chart</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ReactECharts
        option={chartOptions}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
        notMerge={true}
      />
    </div>
  );
}
