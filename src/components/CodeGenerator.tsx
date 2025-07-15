import React, { useState } from 'react';
import { ChartType, ChartData, LineChartData, ChartConfig } from '../types/ChartTypes';
import { Copy, Download, Code } from 'lucide-react';

interface CodeGeneratorProps {
  type: ChartType;
  data: ChartData[] | LineChartData[];
  config: ChartConfig;
  title?: string;
}

const CodeGenerator: React.FC<CodeGeneratorProps> = ({ type, data, config, title }) => {
  const [activeTab, setActiveTab] = useState<'react' | 'vanilla' | 'config'>('react');
  const [copied, setCopied] = useState(false);

  const generateReactCode = () => {
    const dataString = JSON.stringify(data, null, 2);
    const configString = JSON.stringify(config, null, 2);

    return `import React from 'react';
import { Chart, ChartEditor, ThemeProvider } from '@whysorush/dynamic-chart-component';

const data = ${dataString};

const config = ${configString};

  return (
  <ThemeProvider>
    <Chart
      type="${type}"
      data={data}
      config={config}
      title="${title || 'My Chart'}"
    />
    </ThemeProvider
  );
}`;
  };

  const generateVanillaCode = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynamic Chart</title>
    <style>
        body {
            font-family: 'Figtree', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .chart-container {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 800px;
            margin: 0 auto;
        }
        canvas {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    <div class="chart-container">
        <h2>${title || 'My Chart'}</h2>
        <canvas id="chart" width="${config.width || 600}" height="${config.height || 400}"></canvas>
    </div>

    <script>
        const data = ${JSON.stringify(data, null, 8)};
        const config = ${JSON.stringify(config, null, 8)};
        
        function drawChart() {
            const canvas = document.getElementById('chart');
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Set font
            ctx.font = \`\${config.fontSize || 14}px \${config.fontFamily || 'Figtree'}\`;
            
            // Your chart drawing logic here
            // This is a simplified example - you'll need to implement the full drawing logic
            
            console.log('Chart type: ${type}');
            console.log('Data:', data);
            console.log('Config:', config);
        }
        
        // Initialize chart
        drawChart();
    </script>
</body>
</html>`;
  };

  const generateConfigCode = () => {
    return `// Chart Configuration Object
const chartConfig = ${JSON.stringify(config, null, 2)};

// Data Structure for ${type} chart
const chartData = ${JSON.stringify(data, null, 2)};

// Usage Example:
// <Chart 
//   type="${type}"
//   data={chartData}
//   config={chartConfig}
//   title="${title || 'My Chart'}"
//   editable={true}
// />

// Available Chart Types:
// - 'line': Line charts for trends over time
// - 'bar': Bar charts for comparing categories
// - 'area': Area charts for cumulative data
// - 'pie': Pie charts for part-to-whole relationships
// - 'donut': Donut charts with center text

// Configuration Options:
// - width/height: Chart dimensions
// - margin: Spacing around chart area
// - colors: Array of colors for data points
// - showGrid: Display background grid
// - showLegend: Display legend
// - showTooltip: Enable hover tooltips
// - animate: Enable entrance animations
// - gradient: Use gradient colors
// - gradientColors: Custom gradient start/end colors
// - fontFamily: Font for text elements
// - fontSize: Size of text elements
// - borderRadius: Rounded corners for bars
// - strokeWidth: Line thickness for line/area charts`;
  };

  const getCode = () => {
    switch (activeTab) {
      case 'react':
        return generateReactCode();
      case 'vanilla':
        return generateVanillaCode();
      case 'config':
        return generateConfigCode();
      default:
        return '';
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadCode = () => {
    const code = getCode();
    const extension = activeTab === 'vanilla' ? 'html' : activeTab === 'config' ? 'js' : 'jsx';
    const filename = `chart-${type}-${activeTab}.${extension}`;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-['Figtree']">
              Generated Code
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors font-['Figtree'] ${
                copied
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Copy size={14} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={downloadCode}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-['Figtree']"
            >
              <Download size={14} />
              Download
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mt-4 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'react', label: 'React Component' },
            { id: 'vanilla', label: 'Vanilla HTML/JS' },
            { id: 'config', label: 'Configuration' }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-4 py-2 text-sm font-medium transition-colors font-['Figtree'] ${
                activeTab === id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Display */}
      <div className="p-0">
        <pre className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-6 overflow-x-auto text-sm font-mono leading-relaxed max-h-96">
          <code>{getCode()}</code>
        </pre>
      </div>

      {/* Usage Instructions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 font-['Figtree']">
          Usage Instructions:
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 font-['Figtree']">
          {activeTab === 'react' && (
            <>
              <p>• Copy the component code and paste it into your React project</p>
              <p>• Make sure you have the Chart component and its dependencies installed</p>
              <p>• Customize the data and config objects as needed</p>
              <p>• The component supports real-time editing and data updates</p>
            </>
          )}
          {activeTab === 'vanilla' && (
            <>
              <p>• Save the code as an HTML file and open in a browser</p>
              <p>• The example includes basic styling and chart initialization</p>
              <p>• You'll need to implement the full drawing logic for production use</p>
              <p>• Consider using a chart library for complex implementations</p>
            </>
          )}
          {activeTab === 'config' && (
            <>
              <p>• Use this configuration object with any chart implementation</p>
              <p>• All properties are optional with sensible defaults</p>
              <p>• Modify colors, dimensions, and behavior as needed</p>
              <p>• The data structure varies by chart type (ChartData vs LineChartData)</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeGenerator;