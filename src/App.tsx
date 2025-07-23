import React, { useState } from "react";
import Chart from "./components/Chart";
import ChartEditor from "./components/ChartEditor";
import CodeGenerator from "./components/CodeGenerator";
import ThemeToggle from "./components/ThemeToggle";
import { ThemeProvider } from "./context/ThemeContext";
import {
  ChartData,
  LineChartData,
  ChartType,
  ChartConfig,
} from "./types/ChartTypes";
import { BarChart3, TrendingUp, Settings, Code, Plus, X } from "lucide-react";
import { Dataset } from "./types/ChartTypes";

// Initial sample data
const initialBarData: ChartData[] = [
  { label: "Jan", value: 65 },
  { label: "Feb", value: 59 },
  { label: "Mar", value: 80 },
  { label: "Apr", value: 81 },
  { label: "May", value: 56 },
  { label: "Jun", value: 55 },
];

const initialLineData: LineChartData[] = [
  { x: "Jan", y: 30 },
  { x: "Feb", y: 45 },
  { x: "Mar", y: 35 },
  { x: "Apr", y: 55 },
  { x: "May", y: 40 },
  { x: "Jun", y: 60 },
  { x: "Jul", y: 50 },
];

const initialConfig: ChartConfig = {
  width: 700,
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

function AppContent() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [chartData, setChartData] = useState<ChartData[] | LineChartData[]>(
    initialBarData
  );
  const [chartConfig, setChartConfig] = useState<ChartConfig>(initialConfig);
  const [chartTitle, setChartTitle] = useState("Interactive Chart");
  const [kpiTitle, setKpiTitle] = useState("KPI");
  const [filter, setFilter] = useState("");
  const [summary, setSummary] = useState<string>(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
  );
  const [filterData, setFilterData] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<"editor" | "code">("editor");

  const handleTypeChange = (newType: ChartType) => {
    setChartType(newType);

    // Switch data format based on chart type
    if (newType === "line" || newType === "area") {
      if (!Array.isArray(chartData) || !("x" in chartData[0])) {
        setChartData(initialLineData);
      }
    } else {
      if (!Array.isArray(chartData) || !("label" in chartData[0])) {
        setChartData(initialBarData);
      }
    }
  };

  const handleDataChange = (
    newData: ChartData[] | LineChartData[] | Dataset[]
  ) => {
    setChartData(newData as ChartData[] | LineChartData[]);
  };

  const handleConfigChange = (newConfig: ChartConfig) => {
    setChartConfig(newConfig);
  };

  const addfilterData = () => {
    const newOption = prompt("Add new filter option:");
    if (newOption && !filterData.includes(newOption)) {
      setFilterData([...filterData, newOption]);
      // Do not setFilter(newOption); // Remove this line to avoid setting selected value
    }
  };

  const removefilterData = (option: string) => {
    // Remove the option from filterData
    const newFilterData = filterData.filter((item) => item !== option);
    setFilterData(newFilterData);
    // Optionally clear filter if removed, or keep as is
    if (filter === option) {
      setFilter("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-green-400 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent font-['Figtree']">
                  Dynamic Chart Builder
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-['Figtree']">
                  Create, customize, and export beautiful charts
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-['Figtree']">
            Build Beautiful, Interactive Charts
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-['Figtree']">
            A fully customizable chart component with real-time editing, dark
            mode support, and code generation. Perfect for any React project.
          </p>
        </div>

        {/* Chart Title Editor */}
        <div className="mb-8 flex gap-4 justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Figtree']">
              Chart Title
            </label>
            <input
              type="text"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-['Figtree'] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter chart title..."
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Figtree']">
              Component Chart Title
            </label>
            <input
              type="text"
              value={kpiTitle}
              onChange={(e) => setKpiTitle(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-['Figtree'] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter title..."
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Figtree']">
              Filter Options
            </label>
            <div className="flex gap-2">
              <select
                name="filter"
                id="filter"
                // value={filter || "None"} // Remove value prop to make uncontrolled
                // onChange handler removed
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-['Figtree'] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {filterData.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                onClick={addfilterData}
                className="px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-['Figtree'] flex items-center gap-1"
                title="Add filter option"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            {/* List filter options with remove buttons */}
            {filterData.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filterData.map((option) => (
                  <span key={option} className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-sm font-['Figtree']">
                    {option}
                    <button
                      onClick={() => removefilterData(option)}
                      className="ml-1 text-red-500 hover:text-red-700"
                      title={`Remove ${option}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Chart Display */}
          <div className="xl:col-span-2">
            <Chart
              type={chartType}
              data={chartData}
              config={chartConfig}
              title={chartTitle}
              kpiTitle={kpiTitle}
              filter={filterData} // Pass filterData as filter (expects string[])
              filterData={filterData}
              summary={summary}
              editable={true}
              onDataChange={handleDataChange}
              onConfigChange={handleConfigChange}
              className="mb-6"
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Figtree']">
                    Data Points
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-['Figtree']">
                  {chartData.length}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Figtree']">
                    Chart Type
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 font-['Figtree'] capitalize">
                  {chartType}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Figtree']">
                    Animation
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 font-['Figtree']">
                  {chartConfig.animate ? "On" : "Off"}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Code className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Figtree']">
                    Gradient
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 font-['Figtree']">
                  {chartConfig.gradient ? "On" : "Off"}
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Panel Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setActivePanel("editor")}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors font-['Figtree'] ${
                    activePanel === "editor"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <Settings size={16} />
                  Editor
                </button>
                <button
                  onClick={() => setActivePanel("code")}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors font-['Figtree'] ${
                    activePanel === "code"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <Code size={16} />
                  Code
                </button>
              </div>
            </div>

            {/* Panel Content */}
            {activePanel === "editor" ? (
              <ChartEditor
                type={chartType}
                data={chartData}
                config={chartConfig}
                onTypeChange={handleTypeChange}
                onDataChange={handleDataChange}
                onConfigChange={handleConfigChange}
              />
            ) : (
              <CodeGenerator
                type={chartType}
                data={chartData}
                config={chartConfig}
                title={chartTitle}
                kpiTitle={kpiTitle}
                filter={filterData}
                summary={summary}
              />
            )}
          </div>
        </div>

        {/* Features Section */}
        {/* <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center font-['Figtree']">
            Key Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🎨',
                title: 'Fully Customizable',
                description: 'Change colors, gradients, fonts, and styling in real-time'
              },
              {
                icon: '📊',
                title: 'Multiple Chart Types',
                description: 'Support for line, bar, area, pie, and donut charts'
              },
              {
                icon: '🌙',
                title: 'Dark Mode Support',
                description: 'Seamless theme switching with proper contrast'
              },
              {
                icon: '✏️',
                title: 'Inline Editing',
                description: 'Edit data points directly in the interface'
              },
              {
                icon: '⚡',
                title: 'Smooth Animations',
                description: 'Beautiful entrance animations and hover effects'
              },
              {
                icon: '💻',
                title: 'Code Generation',
                description: 'Export React, vanilla JS, or configuration code'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-['Figtree']">
                  {feature.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-['Figtree']">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div> */}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
