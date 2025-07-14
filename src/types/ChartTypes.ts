export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  x: string | number;
  y: number;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  gradient?: boolean;
  gradientColors?: {
    start: string;
    end: string;
  };
  fontFamily?: string;
  fontSize?: number;
  borderRadius?: number;
  strokeWidth?: number;
}

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut';

export interface ChartProps {
  type: ChartType;
  data: ChartData[] | LineChartData[];
  config?: ChartConfig;
  title?: string;
  className?: string;
  onDataChange?: (data: ChartData[] | LineChartData[]) => void;
  onConfigChange?: (config: ChartConfig) => void;
  editable?: boolean;
}

export interface EditableChartState {
  isEditing: boolean;
  editingIndex: number | null;
  tempValue: string;
}