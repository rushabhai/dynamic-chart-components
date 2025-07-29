import React, { useState } from 'react';
import { ChartType, ChartData, LineChartData, ChartConfig } from '../types/ChartTypes';
import { Copy, Download, Code } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CodeGeneratorProps {
  type: ChartType;
  data: ChartData[] | LineChartData[];
  config: ChartConfig;
  title?: string;
  kpiTitle?: string;
  filter?: string[];
  summary?: string;
  showSummaryTable?: boolean;
  displayOptions?: {
    showChart?: boolean;
    showTable?: boolean;
    showTitle?: boolean;
    showFilter?: boolean;
    showSummary?: boolean;
  };
}

const CodeGenerator: React.FC<CodeGeneratorProps> = ({
  type,
  data,
  config,
  title,
  kpiTitle,
  filter,
  summary,
  showSummaryTable,
  displayOptions
}) => {
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();

  // Generate summary table rows for bar, pie, donut
  const getSummaryRows = () => {
    if (!(type === 'bar' || type === 'pie' || type === 'donut')) return { mergedRows: [], total: 0, avg: 0 };
    const chartData: ChartData[] = Array.isArray(data) ? (data as ChartData[]).filter(d => typeof d.label === 'string' && typeof d.value === 'number') : [];
    // Merge repeated labels by summing their values
    const labelMap = new Map<string, number>();
    chartData.forEach(item => {
      if (labelMap.has(item.label)) {
        labelMap.set(item.label, labelMap.get(item.label)! + item.value);
      } else {
        labelMap.set(item.label, item.value);
      }
    });
    let mergedRows = Array.from(labelMap.entries()).map(([label, value]) => ({ label, value }));
    const total = mergedRows.reduce((sum, d) => sum + d.value, 0);
    const avg = mergedRows.length ? total / mergedRows.length : 0;
    mergedRows = mergedRows.sort((a, b) => b.value - a.value);
    return { mergedRows, total, avg };
  };


  // Generate the minimal React code as a string
  const generateReactCode = () => {
    const dataString = JSON.stringify(data, null, 2);
    const configString = JSON.stringify(config, null, 2);
    const typeString = JSON.stringify(type);
    const titleString = displayOptions?.showTitle && title ? ` title="${title}"` : '';
    const kpiTitleString = kpiTitle ? ` kpiTitle="${kpiTitle}"` : '';
    const filterString = displayOptions?.showFilter && filter ? ` filter={${JSON.stringify(filter)}}` : '';
    const summaryString = displayOptions?.showSummary && summary ? ` summary={${JSON.stringify(summary)}}` : '';
    const showSummaryTableString = displayOptions?.showTable ? ` showSummaryTable={true}` : '';
    const displayOptionsString = displayOptions ? ` displayOptions={${JSON.stringify(displayOptions)}}` : '';

    return `import React from 'react';
import { Chart, ThemeProvider } from '@whysorush/dynamic-chart-component';

const data = ${dataString};
const config = ${configString};

export default function GeneratedChart() {
  return (
  <ThemeProvider>
    <Chart
      type={${typeString}}
      data={data}
      config={config}${titleString}${kpiTitleString}${filterString}
      summary={${summary ? JSON.stringify(summary) : 'undefined'}}
      showSummaryTable={${showSummaryTable ? 'true' : 'false'}}
      displayOptions={${displayOptions ? JSON.stringify(displayOptions) : 'undefined'}}
    />
    <ThemeProvider>
  );
}
`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateReactCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadCode = () => {
    const code = generateReactCode();
    const filename = `chart-${type}-react.jsx`;
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
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-['Figtree']">
              Generated React Code
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
      </div>
      {/* Code Display */}
      <div className="p-0">
        <pre className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed max-h-96">
          <code className="whitespace-pre-wrap break-words">{generateReactCode()}</code>
        </pre>
      </div>
      {/* Usage Instructions */}
      <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 font-['Figtree']">
          Usage Instructions:
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 font-['Figtree']">
          <p className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>Copy the component code and paste it into your React project</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>Make sure you have the Chart component and its dependencies installed</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>Customize the data and config objects as needed</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>The component supports a toggleable summary table and adapts to dark/light mode</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CodeGenerator;
