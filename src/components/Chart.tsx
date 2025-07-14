import React, { useEffect, useRef, useState } from 'react';
import { ChartProps, ChartData, LineChartData, Dataset, EditableChartState } from '../types/ChartTypes';
import { useTheme } from '../context/ThemeContext';
import { Edit3, Check, X } from 'lucide-react';

const Chart: React.FC<ChartProps> = ({ 
  type, 
  data, 
  config = {}, 
  title,
  className = '',
  onDataChange,
  onConfigChange,
  editable = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [editState, setEditState] = useState<EditableChartState>({
    isEditing: false,
    editingIndex: null,
    tempValue: ''
  });
  const { isDark } = useTheme();

  const defaultConfig = {
    width: 600,
    height: 400,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    colors: [
      'rgba(0, 201, 255, 0.8)',
      'rgba(146, 254, 157, 0.8)',
      'rgba(255, 107, 107, 0.8)',
      'rgba(255, 206, 84, 0.8)',
      'rgba(159, 122, 234, 0.8)',
      'rgba(255, 159, 243, 0.8)'
    ],
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    animate: true,
    gradient: true,
    gradientColors: {
      start: 'rgba(0, 201, 255, 0.85)',
      end: 'rgba(146, 254, 157, 0.85)'
    },
    fontFamily: 'Figtree',
    fontSize: 14,
    borderRadius: 4,
    strokeWidth: 3,
    ...config
  };

  // Check if we have multi-dataset for line/area charts
  const isMultiDataset = (type === 'line' || type === 'area') && 
    Array.isArray(data) && 
    data.length > 0 && 
    'id' in data[0];

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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, margin } = defaultConfig;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.font = `${defaultConfig.fontSize}px '${defaultConfig.fontFamily}', sans-serif`;

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    const backgroundColor = isDark ? '#1f2937' : '#ffffff';

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    switch (type) {
      case 'line':
        drawLineChart(ctx, data as LineChartData[] | Dataset[], chartWidth, chartHeight, margin, textColor, gridColor);
        break;
      case 'bar':
        drawBarChart(ctx, data as ChartData[], chartWidth, chartHeight, margin, textColor, gridColor);
        break;
      case 'area':
        drawAreaChart(ctx, data as LineChartData[] | Dataset[], chartWidth, chartHeight, margin, textColor, gridColor);
        break;
      case 'pie':
        drawPieChart(ctx, data as ChartData[], Math.min(chartWidth, chartHeight), textColor);
        break;
      case 'donut':
        drawDonutChart(ctx, data as ChartData[], Math.min(chartWidth, chartHeight), textColor);
        break;
    }
  };

  const createGradient = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
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
    const isMultiDataset = Array.isArray(chartData) && chartData.length > 0 && 'id' in chartData[0];
    const datasets = isMultiDataset ? 
      (chartData as Dataset[]).filter(d => d.visible) : 
      [{ 
        id: '0', 
        label: 'Data', 
        data: chartData as LineChartData[], 
        color: defaultConfig.colors[0],
        visible: true,
        strokeWidth: defaultConfig.strokeWidth || 2,
        opacity: 0.8
      }];

    if (datasets.length === 0 || datasets[0].data.length === 0) return;

    // Calculate min/max across all visible datasets
    const allValues = datasets.flatMap(dataset => dataset.data.map(d => d.y));
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
        ctx.strokeStyle = createGradient(ctx, 0, margin.top, 0, margin.top + chartHeight);
      } else {
        ctx.strokeStyle = dataset.color;
      }
      
      ctx.lineWidth = dataset.strokeWidth || defaultConfig.strokeWidth || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = dataset.opacity || 0.8;

      // Draw line
      ctx.beginPath();
      datasetData.forEach((point, index) => {
        const x = margin.left + (index / (datasetData.length - 1)) * chartWidth;
        const y = margin.top + chartHeight - ((point.y - minY + padding) / (maxY - minY + 2 * padding)) * chartHeight;
        
        const animatedY = margin.top + chartHeight - (((point.y - minY + padding) / (maxY - minY + 2 * padding)) * chartHeight * animationProgress);
        
        if (index === 0) {
          ctx.moveTo(x, animatedY);
        } else {
          ctx.lineTo(x, animatedY);
        }
      });
      ctx.stroke();

      // Draw points
      ctx.fillStyle = dataset.color;
      datasetData.forEach((point, index) => {
        const x = margin.left + (index / (datasetData.length - 1)) * chartWidth;
        const y = margin.top + chartHeight - (((point.y - minY + padding) / (maxY - minY + 2 * padding)) * chartHeight * animationProgress);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // Reset global alpha
    ctx.globalAlpha = 1;

    // Draw x-axis labels (use first dataset's x values)
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    datasets[0].data.forEach((point, index) => {
      const x = margin.left + (index / (datasets[0].data.length - 1)) * chartWidth;
      ctx.fillText(point.x.toString(), x, defaultConfig.height - 10);
    });
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
    const maxValue = Math.max(...chartData.map(d => d.value));
    const barWidth = chartWidth / chartData.length * 0.8;
    const barSpacing = chartWidth / chartData.length * 0.2;

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
    if (defaultConfig.showBarBackground !== false) {
      ctx.fillStyle = defaultConfig.barBackgroundColor || (isDark ? '#33445B' : '#F5F5F5');
      chartData.forEach((_, index) => {
        const x = margin.left + index * (barWidth + barSpacing) + barSpacing / 2;
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
      const barHeight = (item.value / maxValue) * chartHeight * animationProgress;
      const y = margin.top + chartHeight - barHeight;

      if (defaultConfig.gradient) {
        ctx.fillStyle = createGradient(ctx, 0, y, 0, y + barHeight);
      } else {
        ctx.fillStyle = item.color || defaultConfig.colors[index % defaultConfig.colors.length];
      }

      const radius = defaultConfig.borderRadius;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, defaultConfig.height - 10);
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
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
    const isMultiDataset = Array.isArray(chartData) && chartData.length > 0 && 'id' in chartData[0];
    const datasets = isMultiDataset ? 
      (chartData as Dataset[]).filter(d => d.visible) : 
      [{ 
        id: '0', 
        label: 'Data', 
        data: chartData as LineChartData[], 
        color: defaultConfig.colors[0],
        visible: true,
        strokeWidth: defaultConfig.strokeWidth || 2,
        opacity: 0.8
      }];

    if (datasets.length === 0 || datasets[0].data.length === 0) return;

    // Calculate min/max across all visible datasets
    const allValues = datasets.flatMap(dataset => dataset.data.map(d => d.y));
    const maxY = Math.max(...allValues);
    const minY = Math.min(...allValues);
    const padding = (maxY - minY) * 0.1;

    // Draw each dataset's area
    datasets.forEach((dataset, datasetIndex) => {
      const datasetData = dataset.data;
      
      // Create area gradient for this dataset
      const areaGradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + chartHeight);
      const baseColor = dataset.color || defaultConfig.colors[datasetIndex % defaultConfig.colors.length];
      
      // Extract RGB values from color string and create gradient
      let startColor, endColor;
      if (baseColor.startsWith('rgba')) {
        startColor = baseColor.replace(/[\d\.]+\)$/g, '0.4)');
        endColor = baseColor.replace(/[\d\.]+\)$/g, '0.1)');
      } else {
        // Handle hex colors
        startColor = `${baseColor}66`; // 40% opacity
        endColor = `${baseColor}1A`; // 10% opacity
      }
      
      areaGradient.addColorStop(0, startColor);
      areaGradient.addColorStop(1, endColor);

      ctx.fillStyle = areaGradient;
      ctx.globalAlpha = dataset.opacity || 0.8;
      ctx.beginPath();
      
      // Draw area
      datasetData.forEach((point, index) => {
        const x = margin.left + (index / (datasetData.length - 1)) * chartWidth;
        const y = margin.top + chartHeight - (((point.y - minY + padding) / (maxY - minY + 2 * padding)) * chartHeight * animationProgress);
        
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
    drawLineChart(ctx, chartData, chartWidth, chartHeight, margin, textColor, gridColor);
  };

  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    chartData: ChartData[],
    size: number,
    textColor: string
  ) => {
    const centerX = defaultConfig.width / 2;
    const centerY = defaultConfig.height / 2;
    const radius = size / 2 - 40;
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    let currentAngle = -Math.PI / 2;

    chartData.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI * animationProgress;
      
      if (defaultConfig.gradient && index === 0) {
        ctx.fillStyle = createGradient(ctx, centerX - radius, centerY - radius, centerX + radius, centerY + radius);
      } else {
        ctx.fillStyle = item.color || defaultConfig.colors[index % defaultConfig.colors.length];
      }
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
      
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText(item.label, labelX, labelY);

      currentAngle += sliceAngle;
    });
  };

  const drawDonutChart = (
  ctx: CanvasRenderingContext2D,
  chartData: ChartData[],
  size: number,
  textColor: string
) => {
  const centerX = defaultConfig.width / 2;
  const centerY = defaultConfig.height / 2;
  const outerRadius = size / 2 - 40;
  const innerRadius = outerRadius * 0.6;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const gapAngle = (2 * Math.PI) / 180;
  let currentAngle = -Math.PI / 2;

  chartData.forEach((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI * animationProgress;
    const startAngle = currentAngle + gapAngle / 2;
    const endAngle = currentAngle + sliceAngle - gapAngle / 2;

    if (defaultConfig.gradient && index === 0) {
      ctx.fillStyle = createGradient(ctx, centerX - outerRadius, centerY - outerRadius, centerX + outerRadius, centerY + outerRadius);
    } else {
      ctx.fillStyle = item.color || defaultConfig.colors[index % defaultConfig.colors.length];
    }

    // Calculate corner radius (scale it appropriately for the donut)
    const cornerRadius = Math.min(defaultConfig.borderRadius * 2, (outerRadius - innerRadius) / 4);

    if (cornerRadius > 0 && sliceAngle > 0.1) { // Only apply rounded corners if slice is large enough
      drawRoundedDonutSlice(ctx, centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, cornerRadius);
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
  ctx.textAlign = 'center';
  ctx.font = `bold 16px '${defaultConfig.fontFamily}', sans-serif`;
  ctx.fillText('Total', centerX, centerY - 10);
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
  // Calculate the positions of the four corners
  const startOuterX = centerX + Math.cos(startAngle) * outerRadius;
  const startOuterY = centerY + Math.sin(startAngle) * outerRadius;
  const endOuterX = centerX + Math.cos(endAngle) * outerRadius;
  const endOuterY = centerY + Math.sin(endAngle) * outerRadius;
  const startInnerX = centerX + Math.cos(startAngle) * innerRadius;
  const startInnerY = centerY + Math.sin(startAngle) * innerRadius;
  const endInnerX = centerX + Math.cos(endAngle) * innerRadius;
  const endInnerY = centerY + Math.sin(endAngle) * innerRadius;

  ctx.beginPath();

  // Start from the outer start point
  ctx.moveTo(startOuterX, startOuterY);

  // Outer arc with rounded corner at the end
  const outerEndControlAngle = endAngle - cornerRadius / outerRadius;
  ctx.arc(centerX, centerY, outerRadius, startAngle, outerEndControlAngle);
  
  // Rounded corner from outer arc to end radial line
  const outerEndControlX = centerX + Math.cos(outerEndControlAngle) * outerRadius;
  const outerEndControlY = centerY + Math.sin(outerEndControlAngle) * outerRadius;
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
  ctx.arc(centerX, centerY, innerRadius, endAngle - cornerRadius / innerRadius, innerStartControlAngle, true);

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

  const handleDataEdit = (index: number, field: 'label' | 'value', newValue: string) => {
    if (!onDataChange) return;

    const newData = [...data];
    if (type === 'line' || type === 'area') {
      const lineData = newData as LineChartData[];
      if (field === 'label') {
        lineData[index].x = newValue;
      } else {
        lineData[index].y = parseFloat(newValue) || 0;
      }
    } else {
      const chartData = newData as ChartData[];
      if (field === 'label') {
        chartData[index].label = newValue;
      } else {
        chartData[index].value = parseFloat(newValue) || 0;
      }
    }
    onDataChange(newData);
  };

  const startEdit = (index: number, currentValue: string) => {
    setEditState({
      isEditing: true,
      editingIndex: index,
      tempValue: currentValue
    });
  };

  const confirmEdit = () => {
    if (editState.editingIndex !== null) {
      handleDataEdit(editState.editingIndex, 'value', editState.tempValue);
    }
    setEditState({ isEditing: false, editingIndex: null, tempValue: '' });
  };

  const cancelEdit = () => {
    setEditState({ isEditing: false, editingIndex: null, tempValue: '' });
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
    const size = Math.min(defaultConfig.width - defaultConfig.margin.left - defaultConfig.margin.right,
                         defaultConfig.height - defaultConfig.margin.top - defaultConfig.margin.bottom);
    
    let tooltipContent = '';

    if (type === 'pie' || type === 'donut') {
      const dx = x - centerX;
      const dy = y - centerY;
      const radius = size / 2 - 40;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (type === 'donut') {
        const innerRadius = radius * 0.6;
        if (distance > radius || distance < innerRadius) return;
      } else if (distance > radius) return;

      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += 2 * Math.PI;

      const total = (data as ChartData[]).reduce((sum, item) => sum + item.value, 0);
      let currentAngle = -Math.PI / 2;
      const segment = (data as ChartData[]).find(item => {
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
    } else if (type === 'bar') {
      const chartWidth = defaultConfig.width - defaultConfig.margin.left - defaultConfig.margin.right;
      const barWidth = chartWidth / data.length * 0.8;
      const barSpacing = chartWidth / data.length * 0.2;
      
      const relativeX = x - defaultConfig.margin.left;
      const barIndex = Math.floor(relativeX / (barWidth + barSpacing));
      const item = (data as ChartData[])[barIndex];
      
      if (item) {
        tooltipContent = `${item.label}: ${item.value}`;
      }
    } else if (type === 'line' || type === 'area') {
      const chartWidth = defaultConfig.width - defaultConfig.margin.left - defaultConfig.margin.right;
      
      if (isMultiDataset) {
        const datasets = (data as Dataset[]).filter(d => d.visible);
        const relativeX = x - defaultConfig.margin.left;
        const pointIndex = Math.round(relativeX / (chartWidth / (datasets[0]?.data.length - 1 || 1)));
        
        let tooltipLines: string[] = [];
        datasets.forEach(dataset => {
          const point = dataset.data[pointIndex];
          if (point) {
            tooltipLines.push(`${dataset.label}: ${point.y}`);
          }
        });
        
        if (tooltipLines.length > 0) {
          const xLabel = datasets[0]?.data[pointIndex]?.x || '';
          tooltipContent = `${xLabel}\n${tooltipLines.join('\n')}`;
        }
      } else {
        const pointSpacing = chartWidth / ((data as LineChartData[]).length - 1);
        const relativeX = x - defaultConfig.margin.left;
        const pointIndex = Math.round(relativeX / pointSpacing);
        const point = (data as LineChartData[])[pointIndex];
        
        if (point) {
          tooltipContent = `${point.x}: ${point.y}`;
        }
      }
    }

    if (tooltipContent) {
      setTooltip({
        x: event.clientX,
        y: event.clientY,
        content: tooltipContent
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 font-['Figtree']">
          {title}
        </h3>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="max-w-full h-auto cursor-crosshair"
        />
        
        {tooltip && (
          <div
            className="fixed z-50 bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-['Figtree'] pointer-events-none whitespace-pre-line"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 40,
            }}
          >
            {tooltip.content}
          </div>
        )}

        {editable && !isMultiDataset && (
          <div className="mt-6 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-['Figtree']">
              Edit Data Points
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data as ChartData[]).map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 font-['Figtree']">
                      {item.label || `Point ${index + 1}`}
                    </span>
                    <button
                      onClick={() => startEdit(index, item.value?.toString() || '0')}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                  
                  {editState.isEditing && editState.editingIndex === index ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editState.tempValue}
                        onChange={(e) => setEditState(prev => ({ ...prev, tempValue: e.target.value }))}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                        autoFocus
                      />
                      <button
                        onClick={confirmEdit}
                        className="p-1 text-green-500 hover:text-green-600"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-red-500 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-['Figtree']">
                      {item.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Updated Legend for Multi-Dataset Support */}
        {defaultConfig.showLegend && (
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {(() => {
              if (type === 'line' || type === 'area') {
                if (isMultiDataset) {
                  const datasets = data as Dataset[];
                  return datasets.map((dataset, index) => (
                    <div key={dataset.id} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded ${dataset.visible ? '' : 'opacity-50'}`}
                        style={{
                          backgroundColor: dataset.color || defaultConfig.colors[index % defaultConfig.colors.length]
                        }}
                      />
                      <span className={`text-sm font-['Figtree'] ${dataset.visible ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                        {dataset.label}
                      </span>
                    </div>
                  ));
                } else {
                  return (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: defaultConfig.colors[0] }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-['Figtree']">
                        Data
                      </span>
                    </div>
                  );
                }
              } else {
                return (data as ChartData[]).map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor: item.color || defaultConfig.colors[index % defaultConfig.colors.length]
                      }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-['Figtree']">
                      {item.label}
                    </span>
                  </div>
                ));
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;