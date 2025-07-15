import React, { useEffect, useRef, useState } from 'react';
import { ChartProps, ChartData, LineChartData, EditableChartState } from '../types/ChartTypes';
import { useTheme } from '../context/ThemeContext';
import { Edit3, Check, X } from 'lucide-react';

const Chart: React.FC<ChartProps> = ({ 
  type, 
  data, 
  config = {}, 
  title,
  className = '',
  onDataChange,
  onConfigChange: _onConfigChange,
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
        drawLineChart(ctx, data as LineChartData[], chartWidth, chartHeight, margin, textColor, gridColor);
        break;
      case 'bar':
        drawBarChart(ctx, data as ChartData[], chartWidth, chartHeight, margin, textColor, gridColor);
        break;
      case 'area':
        drawAreaChart(ctx, data as LineChartData[], chartWidth, chartHeight, margin, textColor, gridColor);
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
    chartData: LineChartData[],
    chartWidth: number,
    chartHeight: number,
    margin: any,
    textColor: string,
    gridColor: string
  ) => {
    if (chartData.length === 0) return;

    const maxY = Math.max(...chartData.map(d => d.y));
    const minY = Math.min(...chartData.map(d => d.y));
    const padding = (maxY - minY) * 0.1;

    if (defaultConfig.showGrid) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      for (let i = 0; i <= 5; i++) {
        const _y = margin.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(margin.left, _y);
        ctx.lineTo(margin.left + chartWidth, _y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    if (defaultConfig.gradient) {
      ctx.strokeStyle = createGradient(ctx, 0, margin.top, 0, margin.top + chartHeight);
    } else {
      ctx.strokeStyle = defaultConfig.colors[0];
    }
    
    ctx.lineWidth = defaultConfig.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    chartData.forEach((point, index) => {
      const x = margin.left + (index / (chartData.length - 1)) * chartWidth;
      const _y = margin.top + chartHeight - ((point.y - minY + padding) / (maxY - minY + 2 * padding)) * chartHeight;
      
      const animatedY = margin.top + chartHeight - (((point.y - minY + padding) / (maxY - minY + 2 * padding)) * chartHeight * animationProgress);
      
      if (index === 0) {
        ctx.moveTo(x, animatedY);
      } else {
        ctx.lineTo(x, animatedY);
      }
    });
    ctx.stroke();

    ctx.fillStyle = defaultConfig.gradient ? createGradient(ctx, 0, margin.top, 0, margin.top + chartHeight) : defaultConfig.colors[0];
    chartData.forEach((point, index) => {
      const x = margin.left + (index / (chartData.length - 1)) * chartWidth;
      const _y = margin.top + chartHeight - (((point.y - minY + padding) / (maxY - minY + 2 * padding)) * chartHeight * animationProgress);
      
      ctx.beginPath();
      ctx.arc(x, _y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    chartData.forEach((point, index) => {
      const x = margin.left + (index / (chartData.length - 1)) * chartWidth;
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
        const _y = margin.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(margin.left, _y);
        ctx.lineTo(margin.left + chartWidth, _y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    chartData.forEach((item, index) => {
      const x = margin.left + index * (barWidth + barSpacing) + barSpacing / 2;
      const barHeight = (item.value / maxValue) * chartHeight * animationProgress;
      const _y = margin.top + chartHeight - barHeight;

      if (defaultConfig.gradient) {
        ctx.fillStyle = createGradient(ctx, 0, _y, 0, _y + barHeight);
      } else {
        ctx.fillStyle = item.color || defaultConfig.colors[index % defaultConfig.colors.length];
      }

      // Rounded rectangles
      const radius = defaultConfig.borderRadius;
      ctx.beginPath();
      ctx.roundRect(x, _y, barWidth, barHeight, [radius, radius, 0, 0]);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, defaultConfig.height - 10);
      ctx.fillText(item.value.toString(), x + barWidth / 2, _y - 5);
    });
  };

  const drawAreaChart = (
    ctx: CanvasRenderingContext2D,
    chartData: LineChartData[],
    chartWidth: number,
    chartHeight: number,
    margin: any,
    textColor: string,
    gridColor: string
  ) => {
    if (chartData.length === 0) return;

    const maxY = Math.max(...chartData.map(d => d.y));
    const minY = Math.min(...chartData.map(d => d.y));
    const padding = (maxY - minY) * 0.1;

    const areaGradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + chartHeight);
    areaGradient.addColorStop(0, defaultConfig.gradientColors!.start.replace('0.85', '0.4'));
    areaGradient.addColorStop(1, defaultConfig.gradientColors!.end.replace('0.85', '0.1'));

    ctx.fillStyle = areaGradient;
    ctx.beginPath();
    
    chartData.forEach((point, index) => {
      const x = margin.left + (index / (chartData.length - 1)) * chartWidth;
      const _y = margin.top + chartHeight - (((point.y - minY + padding) / (maxY - minY + 2 * padding)) * chartHeight * animationProgress);
      
      if (index === 0) {
        ctx.moveTo(x, margin.top + chartHeight);
        ctx.lineTo(x, _y);
      } else {
        ctx.lineTo(x, _y);
      }
    });
    
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.closePath();
    ctx.fill();

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

    let currentAngle = -Math.PI / 2;

    chartData.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI * animationProgress;
      
      if (defaultConfig.gradient && index === 0) {
        ctx.fillStyle = createGradient(ctx, centerX - outerRadius, centerY - outerRadius, centerX + outerRadius, centerY + outerRadius);
      } else {
        ctx.fillStyle = item.color || defaultConfig.colors[index % defaultConfig.colors.length];
      }
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fill();

      currentAngle += sliceAngle;
    });

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = `bold 16px '${defaultConfig.fontFamily}', sans-serif`;
    ctx.fillText('Total', centerX, centerY - 10);
    ctx.font = `20px '${defaultConfig.fontFamily}', sans-serif`;
    ctx.fillText(total.toString(), centerX, centerY + 15);
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
    // onDataChange(newData);
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

    setTooltip({
      x: event.clientX,
      y: event.clientY,
      content: `Position: (${Math.round(x)}, ${Math.round(y)})`
    });
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
            className="fixed z-50 bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-['Figtree'] pointer-events-none"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 40,
            }}
          >
            {tooltip.content}
          </div>
        )}

        {editable && (type === 'bar' || type === 'pie' || type === 'donut') && (
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

        {defaultConfig.showLegend && type !== 'line' && type !== 'area' && (
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {(data as ChartData[]).map((item, index) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;