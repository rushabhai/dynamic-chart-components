import React, { useEffect, useRef, useState } from "react";
import {
  ChartProps,
  ChartData,
  LineChartData,
  Dataset,
  EditableChartState,
  KPIOption,
} from "../types/ChartTypes";
import { useTheme } from "../context/ThemeContext";
import { Edit3, Check, X } from "lucide-react";
import DataActions from "./DataActions";
import ChartSummaryTable from "./ChartSummaryTable";

// Add filterData to props
type ChartPropsWithFilterData = ChartProps & {
  selectedFilter?: string;
  filterOptions?: string[];
  showSummaryTable?: boolean;
   kpiData?: KPIOption[];
};

const Chart: React.FC<ChartPropsWithFilterData> = ({
  type,
  data,
  config = {},
  title,
  kpiData = [],
    selectedFilter, 
   filterOptions = [],
  summary,
  className = "",
  onDataChange,
  // editable = false,
  showSummaryTable: propShowSummaryTable = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [editState, setEditState] = useState<EditableChartState>({
    isEditing: false,
    editingIndex: null,
    tempValue: "",
  });
  const { isDark } = useTheme();

  const defaultConfig = {
    width: 600,
    height: 400,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    colors: [
      "rgba(0, 201, 255, 0.8)",
      "rgba(146, 254, 157, 0.8)",
      "rgba(255, 107, 107, 0.8)",
      "rgba(255, 206, 84, 0.8)",
      "rgba(159, 122, 234, 0.8)",
      "rgba(255, 159, 243, 0.8)",
    ],
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    animate: true,
    gradient: true,
    gradientColors: {
      start: "rgba(0, 201, 255, 0.85)",
      end: "rgba(146, 254, 157, 0.85)",
    },
    fontFamily: "Figtree",
    fontSize: 14,
    borderRadius: 4,
    strokeWidth: 3,
    ...config,
  };

  // console.log("selected filter: ", filterData)

  // Check if we have multi-dataset for line/area charts
  const isMultiDataset =
    (type === "line" || type === "area") &&
    Array.isArray(data) &&
    data.length > 0 &&
    "id" in data[0];

  useEffect(() => {
    if (defaultConfig.animate) {
      const startTime = Date.now();
      const duration = 1000;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimationProgress(progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    } else {
      setAnimationProgress(1);
    }
  }, [data, defaultConfig.animate]);

  useEffect(() => {
    drawChart();
  }, [data, animationProgress, isDark, defaultConfig]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height, margin } = defaultConfig;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.font = `${defaultConfig.fontSize}px '${defaultConfig.fontFamily}', sans-serif`;

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const textColor = isDark ? "#e5e7eb" : "#374151";
    const gridColor = isDark ? "#374151" : "#e5e7eb";
    const backgroundColor = isDark ? "#1f2937" : "#ffffff";

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Validate data before drawing
    if (!data || data.length === 0) return;

    try {
      switch (type) {
        case "line":
          drawLineChart(
            ctx,
            data as LineChartData[] | Dataset[],
            chartWidth,
            chartHeight,
            margin,
            textColor,
            gridColor
          );
          break;
        case "bar":
          // Ensure we have proper ChartData for bar charts
          const barData = ensureChartData(data);
          drawBarChart(
            ctx,
            barData,
            chartWidth,
            chartHeight,
            margin,
            textColor,
            gridColor
          );
          break;
        case "area":
          drawAreaChart(
            ctx,
            data as LineChartData[] | Dataset[],
            chartWidth,
            chartHeight,
            margin,
            textColor,
            gridColor
          );
          break;
        case "pie":
          const pieData = ensureChartData(data);
          drawPieChart(
            ctx,
            pieData,
            Math.min(chartWidth, chartHeight),
            textColor
          );
          break;
        case "donut":
          const donutData = ensureChartData(data);
          drawDonutChart(
            ctx,
            donutData,
            Math.min(chartWidth, chartHeight),
            textColor
          );
          break;
      }
    } catch (error) {
      console.error("Error drawing chart:", error);
    }
  };

  // Helper function to ensure we have proper ChartData for non-line/area charts
  const ensureChartData = (
    inputData: ChartData[] | LineChartData[] | Dataset[]
  ): ChartData[] => {
    if (!inputData || inputData.length === 0) return [];

    // Check if it's already ChartData
    if ("label" in inputData[0] && "value" in inputData[0]) {
      return inputData as ChartData[];
    }

    // Convert Dataset[] to ChartData[] (shouldn't happen for bar/pie/donut, but just in case)
    if ("id" in inputData[0]) {
      const datasets = inputData as Dataset[];
      // Convert first dataset to ChartData
      if (datasets[0] && datasets[0].data) {
        return datasets[0].data.map((item, index) => ({
          label: item.x.toString(),
          value: item.y,
          color:
            datasets[0].color ||
            defaultConfig.colors[index % defaultConfig.colors.length],
        }));
      }
    }

    // Convert LineChartData[] to ChartData[]
    const lineData = inputData as LineChartData[];
    return lineData.map((item, index) => ({
      label: item.x.toString(),
      value: item.y,
      color: defaultConfig.colors[index % defaultConfig.colors.length],
    }));
  };

  const createGradient = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    // Validate gradient parameters
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
      console.warn("Invalid gradient parameters, using default color");
      return defaultConfig.colors[0];
    }

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, defaultConfig.gradientColors!.start);
    gradient.addColorStop(1, defaultConfig.gradientColors!.end);
    return gradient;
  };

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    chartData: LineChartData[] | Dataset[],
    chartWidth: number,
    chartHeight: number,
    margin: any,
    textColor: string,
    gridColor: string
  ) => {
    // Check if we have multiple datasets
    const isMultiDataset =
      Array.isArray(chartData) && chartData.length > 0 && "id" in chartData[0];
    const datasets = isMultiDataset
      ? (chartData as Dataset[]).filter((d) => d.visible)
      : [
          {
            id: "0",
            label: "Data",
            data: chartData as LineChartData[],
            color: defaultConfig.colors[0],
            visible: true,
            strokeWidth: defaultConfig.strokeWidth || 2,
            opacity: 0.8,
          },
        ];

    if (
      datasets.length === 0 ||
      !datasets[0].data ||
      datasets[0].data.length === 0
    )
      return;

    // Calculate min/max across all visible datasets
    const allValues = datasets.flatMap((dataset) =>
      dataset.data.map((d) => d.y)
    );
    const maxY = Math.max(...allValues);
    const minY = Math.min(...allValues);
    const padding = (maxY - minY) * 0.1;

    // Draw grid
    if (defaultConfig.showGrid) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      for (let i = 0; i <= 5; i++) {
        const y = margin.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartWidth, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const datasetData = dataset.data;

      // Set dataset-specific stroke style
      if (defaultConfig.gradient && datasetIndex === 0 && !isMultiDataset) {
        ctx.strokeStyle = createGradient(
          ctx,
          0,
          margin.top,
          0,
          margin.top + chartHeight
        );
      } else {
        ctx.strokeStyle = dataset.color;
      }

      ctx.lineWidth = dataset.strokeWidth || defaultConfig.strokeWidth || 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = dataset.opacity || 0.8;

      // Draw line
      ctx.beginPath();
      datasetData.forEach((point, index) => {
        const x = margin.left + (index / (datasetData.length - 1)) * chartWidth;
        const y =
          margin.top +
          chartHeight -
          ((point.y - minY + padding) / (maxY - minY + 2 * padding)) *
            chartHeight;

        const animatedY =
          margin.top +
          chartHeight -
          ((point.y - minY + padding) / (maxY - minY + 2 * padding)) *
            chartHeight *
            animationProgress;

        if (index === 0) {
          ctx.moveTo(x, animatedY);
        } else {
          ctx.lineTo(x, animatedY);
        }
      });
      ctx.stroke();

      // Draw points
      if (defaultConfig.gradient) {
        ctx.fillStyle = createGradient(
          ctx,
          0,
          margin.top,
          0,
          margin.top + chartHeight
        );
      } else {
        ctx.fillStyle = dataset.color;
      }
      datasetData.forEach((point, index) => {
        const x = margin.left + (index / (datasetData.length - 1)) * chartWidth;
        const y =
          margin.top +
          chartHeight -
          ((point.y - minY + padding) / (maxY - minY + 2 * padding)) *
            chartHeight *
            animationProgress;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // Reset global alpha
    ctx.globalAlpha = 1;

    // Draw x-axis labels (use first dataset's x values)
    if (datasets[0] && datasets[0].data && datasets[0].data.length > 0) {
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      datasets[0].data.forEach((point, index) => {
        const x =
          margin.left + (index / (datasets[0].data.length - 1)) * chartWidth;
        ctx.fillText(point.x.toString(), x, defaultConfig.height - 10);
      });
    }
  };

  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    chartData: ChartData[],
    chartWidth: number,
    chartHeight: number,
    margin: any,
    textColor: string,
    gridColor: string
  ) => {
    if (!chartData || chartData.length === 0) return;

    const maxValue = Math.max(...chartData.map((d) => d.value));
    if (maxValue === 0) return;

    const barWidth = (chartWidth / chartData.length) * 0.8;
    const barSpacing = (chartWidth / chartData.length) * 0.2;

    if (defaultConfig.showGrid) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      for (let i = 0; i <= 5; i++) {
        const y = margin.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartWidth, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Draw background bars first if background color is specified or in dark mode
    // Draw background bars first if in dark mode
    if (isDark) {
      ctx.fillStyle = "#33445B";
      chartData.forEach((_, index) => {
        const x =
          margin.left + index * (barWidth + barSpacing) + barSpacing / 2;
        const y = margin.top;

        const radius = defaultConfig.borderRadius;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, chartHeight, [radius, radius, 0, 0]);
        ctx.fill();
      });
    }

    // Draw actual data bars
    chartData.forEach((item, index) => {
      const x = margin.left + index * (barWidth + barSpacing) + barSpacing / 2;
      const barHeight =
        (item.value / maxValue) * chartHeight * animationProgress;
      const y = margin.top + chartHeight - barHeight;

      if (defaultConfig.gradient && isFinite(y) && isFinite(barHeight)) {
        const gradient = createGradient(ctx, 0, y, 0, y + barHeight);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle =
          item.color ||
          defaultConfig.colors[index % defaultConfig.colors.length];
      }

      const radius = defaultConfig.borderRadius;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      if (item.label) {
        ctx.fillText(item.label, x + barWidth / 2, defaultConfig.height - 10);
      }
      if (item.value !== undefined) {
        ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
      }
    });
  };

  const drawAreaChart = (
    ctx: CanvasRenderingContext2D,
    chartData: LineChartData[] | Dataset[],
    chartWidth: number,
    chartHeight: number,
    margin: any,
    textColor: string,
    gridColor: string
  ) => {
    // Check if we have multiple datasets
    const isMultiDataset =
      Array.isArray(chartData) && chartData.length > 0 && "id" in chartData[0];
    const datasets = isMultiDataset
      ? (chartData as Dataset[]).filter((d) => d.visible)
      : [
          {
            id: "0",
            label: "Data",
            data: chartData as LineChartData[],
            color: defaultConfig.colors[0],
            visible: true,
            strokeWidth: defaultConfig.strokeWidth || 2,
            opacity: 0.8,
          },
        ];

    if (
      datasets.length === 0 ||
      !datasets[0].data ||
      datasets[0].data.length === 0
    )
      return;

    // Calculate min/max across all visible datasets
    const allValues = datasets.flatMap((dataset) =>
      dataset.data.map((d) => d.y)
    );
    const maxY = Math.max(...allValues);
    const minY = Math.min(...allValues);
    const padding = (maxY - minY) * 0.1;

    // Draw each dataset's area
    datasets.forEach((dataset, datasetIndex) => {
      const datasetData = dataset.data;

      // Create area gradient for this dataset
      let areaGradient;
      if (defaultConfig.gradient && defaultConfig.gradientColors) {
        areaGradient = ctx.createLinearGradient(
          0,
          margin.top,
          0,
          margin.top + chartHeight
        );

        // Create lower opacity versions of the gradient colors
        let startColor, endColor;

        if (defaultConfig.gradientColors.start.startsWith("rgba")) {
          startColor = defaultConfig.gradientColors.start.replace(
            /[\d\.]+\)$/g,
            "0.3)"
          );
        } else if (defaultConfig.gradientColors.start.startsWith("#")) {
          startColor = `${defaultConfig.gradientColors.start}66`; // 40% opacity
        } else {
          startColor = defaultConfig.gradientColors.start;
        }

        if (defaultConfig.gradientColors.end.startsWith("rgba")) {
          endColor = defaultConfig.gradientColors.end.replace(
            /[\d\.]+\)$/g,
            "0.1)"
          );
        } else if (defaultConfig.gradientColors.end.startsWith("#")) {
          endColor = `${defaultConfig.gradientColors.end}1A`; // 10% opacity
        } else {
          endColor = defaultConfig.gradientColors.end;
        }

        areaGradient.addColorStop(0.2, startColor);
        areaGradient.addColorStop(1, endColor);
      } else {
        areaGradient = ctx.createLinearGradient(
          0,
          margin.top,
          0,
          margin.top + chartHeight
        );
        const baseColor =
          dataset.color ||
          defaultConfig.colors[datasetIndex % defaultConfig.colors.length];

        // Extract RGB values from color string and create gradient
        let startColor, endColor;
        if (baseColor.startsWith("rgba")) {
          startColor = baseColor.replace(/[\d\.]+\)$/g, "0.4)");
          endColor = baseColor.replace(/[\d\.]+\)$/g, "0.1)");
        } else {
          // Handle hex colors
          startColor = `${baseColor}66`; // 40% opacity
          endColor = `${baseColor}1A`; // 10% opacity
        }

        areaGradient.addColorStop(0, startColor);
        areaGradient.addColorStop(1, endColor);
      }

      ctx.fillStyle = areaGradient;
      ctx.globalAlpha = dataset.opacity || 0.8;
      ctx.beginPath();

      // Draw area
      datasetData.forEach((point, index) => {
        const x = margin.left + (index / (datasetData.length - 1)) * chartWidth;
        const y =
          margin.top +
          chartHeight -
          ((point.y - minY + padding) / (maxY - minY + 2 * padding)) *
            chartHeight *
            animationProgress;

        if (index === 0) {
          ctx.moveTo(x, margin.top + chartHeight);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
      ctx.closePath();
      ctx.fill();
    });

    // Reset alpha
    ctx.globalAlpha = 1;

    // Draw lines on top
    drawLineChart(
      ctx,
      chartData,
      chartWidth,
      chartHeight,
      margin,
      textColor,
      gridColor
    );
  };

  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    chartData: ChartData[],
    size: number,
    textColor: string
  ) => {
    if (!chartData || chartData.length === 0) return;

    const centerX = defaultConfig.width / 2;
    const centerY = defaultConfig.height / 2;
    const radius = size / 2 - 40;
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) return;

    let currentAngle = -Math.PI / 2;

    chartData.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI * animationProgress;

      if (defaultConfig.gradient) {
        // Create individual gradient for each slice
        const baseColor =
          item.color ||
          defaultConfig.colors[index % defaultConfig.colors.length];

        // Create radial gradient for this slice
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0, // Inner circle (center)
          centerX,
          centerY,
          radius // Outer circle (edge)
        );

        // Convert the base color to create gradient stops
        let lightColor, darkColor;

        if (baseColor.startsWith("rgba")) {
          // Extract RGBA values and create lighter and darker versions
          const rgbaMatch = baseColor.match(
            /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/
          );
          if (rgbaMatch) {
            const [, r, g, b, a] = rgbaMatch;
            // Lighter version (closer to center)
            lightColor = `rgba(${Math.min(255, parseInt(r) + 40)}, ${Math.min(
              255,
              parseInt(g) + 40
            )}, ${Math.min(255, parseInt(b) + 40)}, ${a})`;
            // Darker version (at the edge)
            darkColor = `rgba(${Math.max(0, parseInt(r) - 20)}, ${Math.max(
              0,
              parseInt(g) - 20
            )}, ${Math.max(0, parseInt(b) - 20)}, ${a})`;
          } else {
            lightColor = baseColor;
            darkColor = baseColor;
          }
        } else if (baseColor.startsWith("#")) {
          // Handle hex colors
          const hex = baseColor.replace("#", "");
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);

          lightColor = `rgb(${Math.min(255, r + 40)}, ${Math.min(
            255,
            g + 40
          )}, ${Math.min(255, b + 40)})`;
          darkColor = `rgb(${Math.max(0, r - 20)}, ${Math.max(
            0,
            g - 20
          )}, ${Math.max(0, b - 20)})`;
        } else {
          // Fallback to original color
          lightColor = baseColor;
          darkColor = baseColor;
        }

        gradient.addColorStop(0, lightColor); // Light color at center
        gradient.addColorStop(0.7, baseColor); // Original color in middle
        gradient.addColorStop(1, darkColor); // Darker color at edge

        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle =
          item.color ||
          defaultConfig.colors[index % defaultConfig.colors.length];
      }

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle
      );
      ctx.closePath();
      ctx.fill();

      if (item.label) {
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 20);

        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.fillText(item.label, labelX, labelY);
      }

      currentAngle += sliceAngle;
    });
  };

  const drawDonutChart = (
    ctx: CanvasRenderingContext2D,
    chartData: ChartData[],
    size: number,
    textColor: string
  ) => {
    if (!chartData || chartData.length === 0) return;

    const centerX = defaultConfig.width / 2;
    const centerY = defaultConfig.height / 2;
    const outerRadius = size / 2 - 40;
    const innerRadius = outerRadius * 0.6;
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) return;

    const gapAngle = (2 * Math.PI) / 180;
    let currentAngle = -Math.PI / 2;

    chartData.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI * animationProgress;
      const startAngle = currentAngle + gapAngle / 2;
      const endAngle = currentAngle + sliceAngle - gapAngle / 2;

      if (defaultConfig.gradient) {
        // Create individual gradient for each donut slice
        const baseColor =
          item.color ||
          defaultConfig.colors[index % defaultConfig.colors.length];

        // Create radial gradient for this slice (from inner radius to outer radius)
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          innerRadius, // Inner circle
          centerX,
          centerY,
          outerRadius // Outer circle
        );

        // Convert the base color to create gradient stops
        let lightColor, darkColor;

        if (baseColor.startsWith("rgba")) {
          // Extract RGBA values and create lighter and darker versions
          const rgbaMatch = baseColor.match(
            /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/
          );
          if (rgbaMatch) {
            const [, r, g, b, a] = rgbaMatch;
            // Lighter version (closer to inner radius)
            lightColor = `rgba(${Math.min(255, parseInt(r) + 40)}, ${Math.min(
              255,
              parseInt(g) + 40
            )}, ${Math.min(255, parseInt(b) + 40)}, ${a})`;
            // Darker version (at the outer edge)
            darkColor = `rgba(${Math.max(0, parseInt(r) - 20)}, ${Math.max(
              0,
              parseInt(g) - 20
            )}, ${Math.max(0, parseInt(b) - 20)}, ${a})`;
          } else {
            lightColor = baseColor;
            darkColor = baseColor;
          }
        } else if (baseColor.startsWith("#")) {
          // Handle hex colors
          const hex = baseColor.replace("#", "");
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);

          lightColor = `rgb(${Math.min(255, r + 40)}, ${Math.min(
            255,
            g + 40
          )}, ${Math.min(255, b + 40)})`;
          darkColor = `rgb(${Math.max(0, r - 20)}, ${Math.max(
            0,
            g - 20
          )}, ${Math.max(0, b - 20)})`;
        } else {
          // Fallback to original color
          lightColor = baseColor;
          darkColor = baseColor;
        }

        gradient.addColorStop(0, lightColor); // Light color at inner radius
        gradient.addColorStop(0.6, baseColor); // Original color in middle
        gradient.addColorStop(1, darkColor); // Darker color at outer edge

        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle =
          item.color ||
          defaultConfig.colors[index % defaultConfig.colors.length];
      }

      // Calculate corner radius (scale it appropriately for the donut)
      const cornerRadius = Math.min(
        defaultConfig.borderRadius * 2,
        (outerRadius - innerRadius) / 4
      );

      if (cornerRadius > 0 && sliceAngle > 0.1) {
        // Only apply rounded corners if slice is large enough
        drawRoundedDonutSlice(
          ctx,
          centerX,
          centerY,
          innerRadius,
          outerRadius,
          startAngle,
          endAngle,
          cornerRadius
        );
      } else {
        // Fallback to regular slice for very small slices or when borderRadius is 0
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();
      }

      currentAngle += sliceAngle;
    });

    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.font = `bold 16px '${defaultConfig.fontFamily}', sans-serif`;
    ctx.fillText("Total", centerX, centerY - 10);
    ctx.font = `20px '${defaultConfig.fontFamily}', sans-serif`;
    ctx.fillText(total.toString(), centerX, centerY + 15);
  };

  // Helper function to draw rounded donut slice
  const drawRoundedDonutSlice = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    cornerRadius: number
  ) => {
    ctx.beginPath();

    // Start from the outer start point
    ctx.moveTo(
      centerX + Math.cos(startAngle) * outerRadius,
      centerY + Math.sin(startAngle) * outerRadius
    );

    // Outer arc with rounded corner at the end
    const outerEndControlAngle = endAngle - cornerRadius / outerRadius;
    ctx.arc(centerX, centerY, outerRadius, startAngle, outerEndControlAngle);

    // Rounded corner from outer arc to end radial line
    ctx.quadraticCurveTo(
      centerX + Math.cos(endAngle) * outerRadius,
      centerY + Math.sin(endAngle) * outerRadius,
      centerX + Math.cos(endAngle) * (outerRadius - cornerRadius),
      centerY + Math.sin(endAngle) * (outerRadius - cornerRadius)
    );

    // Line toward inner radius with rounded corner
    ctx.lineTo(
      centerX + Math.cos(endAngle) * (innerRadius + cornerRadius),
      centerY + Math.sin(endAngle) * (innerRadius + cornerRadius)
    );

    // Rounded corner from end radial line to inner arc
    ctx.quadraticCurveTo(
      centerX + Math.cos(endAngle) * innerRadius,
      centerY + Math.sin(endAngle) * innerRadius,
      centerX + Math.cos(endAngle - cornerRadius / innerRadius) * innerRadius,
      centerY + Math.sin(endAngle - cornerRadius / innerRadius) * innerRadius
    );

    // Inner arc with rounded corner at the start
    const innerStartControlAngle = startAngle + cornerRadius / innerRadius;
    ctx.arc(
      centerX,
      centerY,
      innerRadius,
      endAngle - cornerRadius / innerRadius,
      innerStartControlAngle,
      true
    );

    // Rounded corner from inner arc to start radial line
    ctx.quadraticCurveTo(
      centerX + Math.cos(startAngle) * innerRadius,
      centerY + Math.sin(startAngle) * innerRadius,
      centerX + Math.cos(startAngle) * (innerRadius + cornerRadius),
      centerY + Math.sin(startAngle) * (innerRadius + cornerRadius)
    );

    // Line toward outer radius with rounded corner
    ctx.lineTo(
      centerX + Math.cos(startAngle) * (outerRadius - cornerRadius),
      centerY + Math.sin(startAngle) * (outerRadius - cornerRadius)
    );

    // Rounded corner from start radial line back to outer arc
    ctx.quadraticCurveTo(
      centerX + Math.cos(startAngle) * outerRadius,
      centerY + Math.sin(startAngle) * outerRadius,
      centerX + Math.cos(startAngle + cornerRadius / outerRadius) * outerRadius,
      centerY + Math.sin(startAngle + cornerRadius / outerRadius) * outerRadius
    );

    ctx.closePath();
    ctx.fill();
  };

  const handleDataEdit = (
    index: number,
    field: "label" | "value",
    newValue: string
  ) => {
    if (!onDataChange) return;

    const newData = [...data]; // Create a shallow copy of the data
    if (type === "line" || type === "area") {
      const lineData = newData as LineChartData[];
      if (field === "label") {
        lineData[index].x = newValue;
      } else {
        lineData[index].y = parseFloat(newValue) || 0;
      }
    } else {
      const chartData = newData as ChartData[];
      if (field === "label") {
        chartData[index].label = newValue;
      } else {
        chartData[index].value = parseFloat(newValue) || 0;
      }
    }
    // Fix: Pass the correct type to onDataChange
    if (type === "line" || type === "area") {
      onDataChange(newData as LineChartData[]);
    } else {
      onDataChange(newData as ChartData[]);
    }
  };

  const startEdit = (index: number, currentValue: string) => {
    setEditState({
      isEditing: true,
      editingIndex: index,
      tempValue: currentValue,
    });
  };

  const confirmEdit = () => {
    if (editState.editingIndex !== null) {
      handleDataEdit(editState.editingIndex, "value", editState.tempValue);
    }
    setEditState({ isEditing: false, editingIndex: null, tempValue: "" });
  };

  const cancelEdit = () => {
    setEditState({ isEditing: false, editingIndex: null, tempValue: "" });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!defaultConfig.showTooltip) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = defaultConfig.width / 2;
    const centerY = defaultConfig.height / 2;
    const size = Math.min(
      defaultConfig.width -
        defaultConfig.margin.left -
        defaultConfig.margin.right,
      defaultConfig.height -
        defaultConfig.margin.top -
        defaultConfig.margin.bottom
    );

    let tooltipContent = "";

    if (type === "pie" || type === "donut") {
      const dx = x - centerX;
      const dy = y - centerY;
      const radius = size / 2 - 40;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (type === "donut") {
        const innerRadius = radius * 0.6;
        if (distance > radius || distance < innerRadius) return;
      } else if (distance > radius) return;

      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += 2 * Math.PI;

      const chartData = ensureChartData(data);
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      let currentAngle = -Math.PI / 2;
      const segment = chartData.find((item) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
          return true;
        }
        currentAngle += sliceAngle;
        return false;
      });

      if (segment) {
        const percentage = ((segment.value / total) * 100).toFixed(1);
        tooltipContent = `${segment.label}: ${segment.value} (${percentage}%)`;
      }
    } else if (type === "bar") {
      const chartWidth =
        defaultConfig.width -
        defaultConfig.margin.left -
        defaultConfig.margin.right;
      const chartData = ensureChartData(data);
      const barWidth = (chartWidth / chartData.length) * 0.8;
      const barSpacing = (chartWidth / chartData.length) * 0.2;

      const relativeX = x - defaultConfig.margin.left;
      const barIndex = Math.floor(relativeX / (barWidth + barSpacing));
      const item = chartData[barIndex];

      if (item) {
        tooltipContent = `${item.label}: ${item.value}`;
      }
    } else if (type === "line" || type === "area") {
      const chartWidth =
        defaultConfig.width -
        defaultConfig.margin.left -
        defaultConfig.margin.right;

      if (isMultiDataset) {
        const datasets = (data as [] | Dataset[]).filter((d) => d.visible);
        const relativeX = x - defaultConfig.margin.left;
        const pointIndex = Math.round(
          relativeX / (chartWidth / (datasets[0]?.data.length - 1 || 1))
        );

        let tooltipLines: string[] = [];
        datasets.forEach((dataset) => {
          const point = dataset.data[pointIndex];
          if (point) {
            tooltipLines.push(`${dataset.label}: ${point.y}`);
          }
        });

        if (tooltipLines.length > 0) {
          const xLabel = datasets[0]?.data[pointIndex]?.x || "";
          tooltipContent = `${xLabel}\n${tooltipLines.join("\n")}`;
        }
      } else {
        const lineData = data as LineChartData[];
        const pointSpacing = chartWidth / (lineData.length - 1);
        const relativeX = x - defaultConfig.margin.left;
        const pointIndex = Math.round(relativeX / pointSpacing);
        const point = lineData[pointIndex];

        if (point) {
          tooltipContent = `${point.x}: ${point.y}`;
        }
      }
    }

    if (tooltipContent) {
      setTooltip({
        x: event.clientX,
        y: event.clientY,
        content: tooltipContent,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // Use config.width and config.height directly, with responsive fallbacks
  const cfg = config as { width?: number; height?: number };
  const chartWidth = typeof cfg.width === "number" ? cfg.width : 700;
  const chartHeight = typeof cfg.height === "number" ? cfg.height : 500;

  // Responsive sizing
  const responsiveWidth =
    typeof chartWidth === "number"
      ? Math.min(chartWidth, window.innerWidth - 48)
      : "100%";
  const responsiveHeight =
    typeof chartHeight === "number"
      ? Math.min(chartHeight, window.innerHeight * 0.6)
      : "auto";

  // Only show summary table if explicitly true
  const showSummaryTable = propShowSummaryTable === true;

  return (
    <div
      role="img"
      aria-label={title ? `Chart: ${title}` : "Chart visualization"}
      aria-describedby={summary ? "chart-summary" : undefined}
      style={{
        width: "100%",
        maxWidth: responsiveWidth,
        minHeight: responsiveHeight,
        border: "2px solid #e5e7eb",
        borderRadius: 12,
        background: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        padding: "0",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        overflow: "hidden",
      }}
      className={`${className} p-4 sm:p-6`}
    >
      {/* Header Section */}
      <div className="flex flex-col gap-3">
        {/* Chart Title */}
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-['Figtree'] leading-tight">
            {title}
          </h3>
        )}
        {/* Multiple KPI Cards and Filter Row */}
        <div className="flex justify-between gap-3">
          {/* KPI Cards Row */}
          {kpiData.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {kpiData.map((kpi, index) => {
                return (
                  <div 
                    key={kpi.type}
                    className="bg-gradient-to-r border rounded-xl p-4 min-w-[160px] flex-1 max-w-[200px]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Figtree']">
                        {kpi.label}
                      </span>
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                        ▲ 100%
                      </span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 font-['Figtree']">
                      {kpi.formatted}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filter Dropdown */}
          {filterOptions  && filterOptions .length > 0 && (
            <div className="flex flex-col">
              <select
                id="chart-filter"
                aria-label="Filter Options"
                value={selectedFilter  || filterOptions [0]}
                className="text-sm font-semibold border px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 font-['Figtree'] bg-white dark:bg-gray-800 min-w-[120px]"
                tabIndex={0}
              >
                {filterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        <canvas
          ref={canvasRef}
          width={defaultConfig.width}
          height={defaultConfig.height}
          style={{
            width: responsiveWidth,
            height: responsiveHeight,
            borderRadius: 8,
            background: isDark ? "#1f2937" : "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            outline: "none",
          }}
          tabIndex={0}
          aria-label={title ? `Chart: ${title}` : "Chart visualization"}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* Chart Summary */}
      {summary && (
        <section id="chart-summary" className="mt-2 mb-2">
          <div className="text-sm text-gray-700 dark:text-gray-300 font-['Figtree']">
            {summary}
          </div>
        </section>
      )}

      {/* Summary Table */}
      {showSummaryTable && <ChartSummaryTable data={data} />}

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 13,
            zIndex: 9999,
            pointerEvents: "none",
            whiteSpace: "pre-line",
            maxWidth: 320,
          }}
          role="tooltip"
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default Chart;
