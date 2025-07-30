// utils/kpiCalculations.ts
import { ChartData, LineChartData, Dataset, KPIType, KPIOption } from '../types/ChartTypes';

export const calculateKPIs = (
  data: ChartData[] | LineChartData[] | Dataset[],
  type: string
): KPIOption[] => {
  let values: number[] = [];

  // Extract values based on data type
  if (Array.isArray(data) && data.length > 0) {
    if ('value' in data[0]) {
      // ChartData
      values = (data as ChartData[]).map(d => d.value);
    } else if ('y' in data[0]) {
      // LineChartData
      values = (data as LineChartData[]).map(d => d.y);
    } else if ('id' in data[0]) {
      // Dataset
      values = (data as Dataset[])
        .filter(d => d.visible)
        .flatMap(d => d.data.map(point => point.y));
    }
  }

  if (values.length === 0) {
    return [];
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = sum / values.length;
  const count = values.length;
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];
  const range = max - min;

  return [
    { type: 'sum', label: 'Total', value: sum, formatted: sum.toLocaleString() },
    { type: 'max', label: 'Maximum', value: max, formatted: max.toLocaleString() },
    { type: 'min', label: 'Minimum', value: min, formatted: min.toLocaleString() },
    { type: 'avg', label: 'Average', value: avg, formatted: avg.toFixed(2) },
    { type: 'count', label: 'Count', value: count, formatted: count.toString() },
    { type: 'median', label: 'Median', value: median, formatted: median.toFixed(2) },
    { type: 'range', label: 'Range', value: range, formatted: range.toLocaleString() },
  ];
};

export const getKPIByType = (kpis: KPIOption[], type: KPIType): KPIOption | null => {
  return kpis.find(kpi => kpi.type === type) || null;
};