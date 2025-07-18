import React, { useState } from "react";
import {
  Plus,
  Palette,
  Settings,
  RotateCcw,
  Trash2,
  Layers,
  // LineChart,
} from "lucide-react";
import {
  ChartData,
  LineChartData,
  Dataset,
  ChartConfig,
  ChartType,
} from "../types/ChartTypes";
import { useTheme } from "../context/ThemeContext";
import DatasetManager from "./DatasetManager";
import Chart from "./Chart";

interface ChartEditorProps {
  type: ChartType;
  data: ChartData[] | LineChartData[] | Dataset[];
  config: ChartConfig;
  onTypeChange: (type: ChartType) => void;
  onDataChange: (data: ChartData[] | LineChartData[] | Dataset[]) => void;
  onConfigChange: (config: ChartConfig) => void;
}

const ChartEditor: React.FC<ChartEditorProps> = ({
  type,
  data,
  config,
  onTypeChange,
  onDataChange,
  onConfigChange,
}) => {
  const [activeTab, setActiveTab] = useState<"data" | "style" | "settings">(
    "data"
  );
  const { isDark } = useTheme();

  const chartTypes: { value: ChartType; label: string }[] = [
    { value: "bar", label: "Bar Chart" },
    { value: "line", label: "Line Chart" },
    { value: "area", label: "Area Chart" },
    { value: "pie", label: "Pie Chart" },
    { value: "donut", label: "Donut Chart" },
  ];

  const isMultiDataset =
    (type === "line" || type === "area") &&
    Array.isArray(data) &&
    data.length > 0 &&
    "id" in data[0];

  const convertToDatasets = () => {
    if (type !== "line" && type !== "area") return;

    const singleDataset: Dataset = {
      id: "1",
      label: "Dataset 1",
      data: data as LineChartData[],
      color: config.colors?.[0] || "#3B82F6",
      visible: true,
      strokeWidth: config.strokeWidth || 2,
      opacity: 0.8,
    };

    onDataChange([singleDataset]);
  };

  const addDataPoint = () => {
    if (type === "line" || type === "area") {
      if (!isMultiDataset) {
        const lineData = data as LineChartData[];
        const newPoint: LineChartData = {
          x: `Point ${lineData.length + 1}`,
          y: Math.floor(Math.random() * 100),
        };
        onDataChange([...lineData, newPoint]);
      }
    } else {
      const chartData = data as ChartData[];
      const newPoint: ChartData = {
        label: `Item ${chartData.length + 1}`,
        value: Math.floor(Math.random() * 100),
      };
      onDataChange([...chartData, newPoint]);
    }
  };

  const removeDataPoint = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    if (type === "line" || type === "area") {
      if (isMultiDataset) {
        onDataChange(newData as Dataset[]);
      } else {
        onDataChange(newData as LineChartData[]);
      }
    } else {
      onDataChange(newData as ChartData[]);
    }
  };

  const updateDataPoint = (index: number, field: string, value: any) => {
    const newData = [...data];
    if (type === "line" || type === "area") {
      const lineData = newData as LineChartData[];
      (lineData[index] as any)[field] =
        field === "y" ? parseFloat(value) || 0 : value;
      if (isMultiDataset) {
        onDataChange(newData as Dataset[]);
      } else {
        onDataChange(newData as LineChartData[]);
      }
    } else {
      const chartData = newData as ChartData[];
      (chartData[index] as any)[field] =
        field === "value" ? parseFloat(value) || 0 : value;
      onDataChange(newData as ChartData[]);
    }
  };

  const resetToDefaults = () => {
    const defaultConfig: ChartConfig = {
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
    };
    onConfigChange(defaultConfig);

    // Also reset all data item colors for bar charts to the default color
    if (type === "bar" || type === "pie" || type === "donut") {
      const newData = [...(data as ChartData[])];
      newData.forEach((item, index) => {
        item.color = defaultConfig.colors?.[index] || "#3B82F6";
      });
      onDataChange(newData);
    }
  };

  const changeChartColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const changeGradient: ChartConfig = {
      gradient: false,
    };
    const newColor = e.target.value;
    // Update config colors
    onConfigChange({
      ...config, ...changeGradient,
      colors: [newColor, ...Array(9).fill(newColor)], // Create array of same color
    });

    // Update all data item colors for bar charts
    if (type === "bar") {
      const newData = [...(data as ChartData[])];
      newData.forEach((item) => {
        item.color = newColor;
      });
      onDataChange(newData);
    }
  };

  const generateRandomData = () => {
    if (type === "line" || type === "area") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
      const newData: LineChartData[] = months.map((month) => ({
        x: month,
        y: Math.floor(Math.random() * 100) + 10,
      }));
      onDataChange(newData);
    } else {
      const categories = [
        "Category A",
        "Category B",
        "Category C",
        "Category D",
        "Category E",
      ];
      const newData: ChartData[] = categories.map((category) => ({
        label: category,
        value: Math.floor(Math.random() * 100) + 10,
      }));
      onDataChange(newData);
    }
  };

  const displayData = [
    {
      label: "Show Grid",
      key: "showGrid",
      value: config.showGrid,
      onClick: () => onConfigChange({ ...config, showGrid: !config.showGrid }),
    },
    {
      label: "Show Legend",
      key: "showLegend",
      value: config.showLegend,
      onClick: () =>
        onConfigChange({ ...config, showLegend: !config.showLegend }),
    },
    {
      label: "Show Tooltip",
      key: "showTooltip",
      value: config.showTooltip,
      onClick: () =>
        onConfigChange({ ...config, showTooltip: !config.showTooltip }),
    },
    {
      label: "Enable Animation",
      key: "animate",
      value: config.animate,
      onClick: () => onConfigChange({ ...config, animate: !config.animate }),
    },
    {
      label: "Use Gradient",
      key: "gradient",
      value: config.gradient,
      onClick: () => onConfigChange({ ...config, gradient: !config.gradient }),
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-['Figtree']">
            Chart Editor
          </h3>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-['Figtree']"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {/* Chart Type Selector */}
        <div className="grid grid-cols-5 gap-2">
          {chartTypes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onTypeChange(value)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors font-['Figtree'] ${
                type === value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "data", label: "Data", icon: Plus },
          { id: "style", label: "Style", icon: Palette },
          { id: "settings", label: "Settings", icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors font-['Figtree'] ${
              activeTab === id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "data" && (
          <div className="space-y-4">
            {/* Multi-Dataset Manager for Line/Area Charts */}
            {(type === "line" || type === "area") && isMultiDataset && (
              <DatasetManager
                datasets={data as Dataset[]}
                onDatasetsChange={onDataChange}
                config={config}
                chartType={type}
              />
            )}

            {/* Single Dataset or Non-Line/Area Charts */}
            {(!isMultiDataset || (type !== "line" && type !== "area")) && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-['Figtree']">
                    Data Points
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={generateRandomData}
                      className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-['Figtree']"
                    >
                      Generate Random
                    </button>
                    <button
                      onClick={addDataPoint}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-['Figtree']"
                    >
                      <Plus size={14} />
                      Add Point
                    </button>
                    {(type === "line" || type === "area") && (
                      <button
                        onClick={convertToDatasets}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-['Figtree']"
                      >
                        <Layers size={14} />
                        Enable Multi-Dataset
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={
                            type === "line" || type === "area"
                              ? (item as LineChartData).x
                              : (item as ChartData).label
                          }
                          onChange={(e) =>
                            updateDataPoint(
                              index,
                              type === "line" || type === "area"
                                ? "x"
                                : "label",
                              e.target.value
                            )
                          }
                          placeholder="Label"
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                        />
                        <input
                          type="number"
                          value={
                            type === "line" || type === "area"
                              ? (item as LineChartData).y
                              : (item as ChartData).value
                          }
                          onChange={(e) =>
                            updateDataPoint(
                              index,
                              type === "line" || type === "area"
                                ? "y"
                                : "value",
                              e.target.value
                            )
                          }
                          placeholder="Value"
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                        />
                      </div>
                      <button
                        onClick={() => removeDataPoint(index)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "style" && (
          <div className="space-y-6">
            {/* Chart Colors */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 font-['Figtree']">
                Chart Colors
              </h4>
              <div className="space-y-4">
                {/* For Multi-Dataset Line/Area Charts */}
                {isMultiDataset && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-['Figtree']">
                      Dataset colors are managed in the Data tab
                    </p>
                  </div>
                )}

                {/* For Single Dataset or Non-Multi-Dataset Charts */}
                {!isMultiDataset && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2 font-['Figtree']">
                        Chart Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.colors?.[0] || "#3B82F6"}
                          onChange={changeChartColor}
                          className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.colors?.[0] || "#3B82F6"}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            // Update config colors
                            onConfigChange({
                              ...config,
                              colors: [newColor, ...Array(9).fill(newColor)], // Create array of same color
                            });

                            // Update all data item colors for bar, pie, donut charts
                            if (type === "bar") {
                              const newData = [...(data as ChartData[])];
                              newData.forEach((item) => {
                                item.color = newColor;
                              });
                              onDataChange(newData);
                            }
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Gradient Colors */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 font-['Figtree']">
                Gradient Colors
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                    Start Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        config.gradientColors?.start
                          ?.replace("rgba(", "#")
                          .replace(/,.*/, "") || "#00c9ff"
                      }
                      onChange={(e) => {
                        const hex = e.target.value;
                        const rgb = hexToRgba(hex, 0.85);
                        onConfigChange({
                          ...config,
                          gradientColors: {
                            ...config.gradientColors!,
                            start: rgb,
                          },
                        });
                      }}
                      className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={
                        config.gradientColors?.start ||
                        "rgba(0, 201, 255, 0.85)"
                      }
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          gradientColors: {
                            ...config.gradientColors!,
                            start: e.target.value,
                          },
                        })
                      }
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                    End Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        config.gradientColors?.end
                          ?.replace("rgba(", "#")
                          .replace(/,.*/, "") || "#92fe9d"
                      }
                      onChange={(e) => {
                        const hex = e.target.value;
                        const rgb = hexToRgba(hex, 0.85);
                        onConfigChange({
                          ...config,
                          gradientColors: {
                            ...config.gradientColors!,
                            end: rgb,
                          },
                        });
                      }}
                      className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={
                        config.gradientColors?.end ||
                        "rgba(146, 254, 157, 0.85)"
                      }
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          gradientColors: {
                            ...config.gradientColors!,
                            end: e.target.value,
                          },
                        })
                      }
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 font-['Figtree']">
                Typography
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                    Font Family
                  </label>
                  <select
                    value={config.fontFamily || "Figtree"}
                    onChange={(e) =>
                      onConfigChange({ ...config, fontFamily: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                  >
                    <option value="Figtree">Figtree</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={config.fontSize || 14}
                    onChange={(e) =>
                      onConfigChange({
                        ...config,
                        fontSize: parseInt(e.target.value) || 14,
                      })
                    }
                    min="8"
                    max="24"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                  />
                </div>
              </div>
            </div>

            {/* Visual Properties */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 font-['Figtree']">
                Visual Properties
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                    Border Radius
                  </label>
                  <input
                    type="number"
                    value={config.borderRadius || 4}
                    onChange={(e) =>
                      onConfigChange({
                        ...config,
                        borderRadius: parseInt(e.target.value) || 4,
                      })
                    }
                    min="0"
                    max="40"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                    Stroke Width
                  </label>
                  <input
                    type="number"
                    value={config.strokeWidth || 3}
                    onChange={(e) =>
                      onConfigChange({
                        ...config,
                        strokeWidth: parseInt(e.target.value) || 3,
                      })
                    }
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Dimensions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 font-['Figtree']">
                Dimensions
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                    Width
                  </label>
                  <input
                    type="number"
                    value={config.width || 600}
                    onChange={(e) =>
                      onConfigChange({
                        ...config,
                        width: parseInt(e.target.value) || 600,
                      })
                    }
                    min="300"
                    max="1200"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                    Height
                  </label>
                  <input
                    type="number"
                    value={config.height || 400}
                    onChange={(e) =>
                      onConfigChange({
                        ...config,
                        height: parseInt(e.target.value) || 400,
                      })
                    }
                    min="200"
                    max="800"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                  />
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 font-['Figtree']">
                Display Options
              </h4>
              <div className="space-y-3">
                {displayData.map(({ label, key, value, onClick }) => (
                  <div className="flex items-center justify-between" key={key}>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-['Figtree']">
                      {label}
                    </span>
                    <button
                      onClick={onClick}
                      className={`w-11 h-6 rounded-full transition-colors ${
                        value ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          value ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}

                {type === "bar" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-['Figtree']">
                      Show Bar Background
                    </span>
                    <button
                      onClick={() =>
                        onConfigChange({
                          ...config,
                          showBarBackground: !config.showBarBackground,
                        })
                      }
                      className={`w-11 h-6 rounded-full transition-colors ${
                        config.showBarBackground !== false
                          ? "bg-blue-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          config.showBarBackground !== false
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* Bar Chart Background Color */}
                {type === "bar" && config.showBarBackground !== false && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-['Figtree']">
                      Bar Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          config.barBackgroundColor
                            ?.replace("rgba(", "#")
                            .replace(/,.*/, "") ||
                          (isDark ? "#33445B" : "#e5e7eb")
                        }
                        onChange={(e) => {
                          const hex = e.target.value;
                          const rgb = hexToRgba(hex, 0.2);
                          onConfigChange({
                            ...config,
                            barBackgroundColor: rgb,
                          });
                        }}
                        className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={
                          config.barBackgroundColor ||
                          (isDark
                            ? "rgba(51, 68, 91, 0.2)"
                            : "rgba(229, 231, 235, 0.2)")
                        }
                        onChange={(e) =>
                          onConfigChange({
                            ...config,
                            barBackgroundColor: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default ChartEditor;
