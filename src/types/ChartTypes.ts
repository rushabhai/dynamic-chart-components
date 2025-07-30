export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  x: string | number;
  y: number;
}

export interface Dataset {
  id: string;
  label: string;
  data: LineChartData[];
  color: string;
  visible: boolean;
  strokeWidth?: number;
  opacity?: number;
}

export interface ChartConfig {
  checkboxData(checkboxData: any): unknown;
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
  barBackgroundColor?: string;
  showBarBackground?: boolean;
  // Added for code generation and prop passing
  title?: string;
  selectedKPIs?: KPIType[];
  filter?: string[];
  type?: ChartType;
}

export type ChartType = "line" | "bar" | "area" | "pie" | "donut";

export interface ChartProps {
  type: ChartType;
  data: ChartData[] | LineChartData[];
  config?: ChartConfig;
  title?: string;
  kpiData?: KPIOption[];
  filter?: string[];
  summary?: string;
  className?: string;
  onDataChange?: (data: ChartData[] | LineChartData[]) => void;
  onConfigChange?: (config: ChartConfig) => void;
  editable?: boolean;
  showSummaryTable?: boolean;
}

export interface EditableChartState {
  isEditing: boolean;
  editingIndex: number | null;
  tempValue: string;
}

export interface ChartSummaryResponse {
  summary: string;
  updatedAt?: string;
  status: "success" | "error";
}

export interface ChartSummaryState {
  summary: string;
  isLoading: boolean;
  error?: string;
}

export type KPIType =
  | "sum"
  | "max"
  | "min"
  | "avg"
  | "count"
  | "median"
  | "range";

export interface KPIOption {
  type: KPIType;
  label: string;
  value: number;
  formatted: string;
}
