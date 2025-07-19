import React, { useState } from "react";
import { Download, Upload, Copy, Clipboard } from "lucide-react";
import { ChartData, LineChartData, Dataset } from "../types/ChartTypes";

interface DataActionsProps {
  type: "line" | "area" | "bar" | "pie" | "donut";
  data: ChartData[] | LineChartData[] | Dataset[];
  onDataChange?: (data: ChartData[] | LineChartData[]) => void;
  onDatasetChange?: (data: Dataset[]) => void;
  isMultiDataset?: boolean;
}

const DataActions: React.FC<DataActionsProps> = ({
  type,
  data,
  onDataChange,
  onDatasetChange,
  isMultiDataset = false,
}) => {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteData, setPasteData] = useState("");

  // Convert between data formats
  const convertToLineChartData = (data: ChartData[]): LineChartData[] => {
    return data.map(item => ({
      x: item.label,
      y: item.value
    }));
  };

  const convertToChartData = (data: LineChartData[]): ChartData[] => {
    return data.map(item => ({
      label: item.x.toString(),
      value: item.y
    }));
  };

  // Parse CSV content - accepts any two-column format (string, number)
  const parseCSV = (csvContent: string): ChartData[] | LineChartData[] => {
    const lines = csvContent.trim().split("\n");
    const result: any[] = [];
    
    // Skip header row if it exists, start from line 1 or 0
    const startIndex = lines.length > 1 ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      
      if (values.length >= 2) {
        const firstValue = values[0];
        const secondValue = values[1];
        
        // Try to parse the second value as a number
        const numericValue = parseFloat(secondValue);
        
        // If second value is a valid number, use first as string, second as number
        if (!isNaN(numericValue)) {
          if (type === "line" || type === "area") {
            result.push({
              x: firstValue,
              y: numericValue
            });
          } else {
            result.push({
              label: firstValue,
              value: numericValue
            });
          }
        } else {
          // If second value is not a number, try first value as number
          const firstAsNumber = parseFloat(firstValue);
          if (!isNaN(firstAsNumber)) {
            if (type === "line" || type === "area") {
              result.push({
                x: secondValue,
                y: firstAsNumber
              });
            } else {
              result.push({
                label: secondValue,
                value: firstAsNumber
              });
            }
          } else {
            // If neither can be parsed as number, default second column to 0
            if (type === "line" || type === "area") {
              result.push({
                x: firstValue,
                y: 0
              });
            } else {
              result.push({
                label: firstValue,
                value: 0
              });
            }
          }
        }
      }
    }
    
    return result;
  };

  // Parse JSON content - accepts any two-property format
  const parseJSON = (jsonContent: string): ChartData[] | LineChartData[] => {
    const parsed = JSON.parse(jsonContent);
    let rawData: any[];

    if (Array.isArray(parsed)) {
      rawData = parsed;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      rawData = parsed.data;
    } else {
      throw new Error("Invalid JSON format - expected an array or object with 'data' property");
    }

    if (rawData.length === 0) {
      throw new Error("No data found in JSON");
    }

    const result: any[] = [];

    rawData.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error(`Invalid data at index ${index} - expected object`);
      }

      const keys = Object.keys(item);
      if (keys.length < 2) {
        throw new Error(`Invalid data at index ${index} - expected at least 2 properties`);
      }

      // Get the first two properties
      const firstKey = keys[0];
      const secondKey = keys[1];
      const firstValue = item[firstKey];
      const secondValue = item[secondKey];

      // Determine which value is the string and which is the number
      const firstIsNumber = typeof firstValue === 'number' || (!isNaN(parseFloat(firstValue)) && isFinite(firstValue));
      const secondIsNumber = typeof secondValue === 'number' || (!isNaN(parseFloat(secondValue)) && isFinite(secondValue));

      let stringValue: string;
      let numberValue: number;

      if (secondIsNumber) {
        // Second value is number, first is string
        stringValue = firstValue?.toString() || '';
        numberValue = typeof secondValue === 'number' ? secondValue : parseFloat(secondValue);
      } else if (firstIsNumber) {
        // First value is number, second is string
        stringValue = secondValue?.toString() || '';
        numberValue = typeof firstValue === 'number' ? firstValue : parseFloat(firstValue);
      } else {
        // Neither is clearly a number, default to first as string, second as 0
        stringValue = firstValue?.toString() || '';
        numberValue = 0;
      }

      // Create the appropriate data structure
      if (type === "line" || type === "area") {
        result.push({
          x: stringValue,
          y: numberValue
        });
      } else {
        result.push({
          label: stringValue,
          value: numberValue
        });
      }
    });

    return result;
  };

  // Convert data to CSV
  const convertToCSV = (): string => {
    if (type === "line" || type === "area") {
      if (isMultiDataset) {
        const datasets = data as Dataset[];
        if (datasets.length === 0) return "";

        // Create headers
        const headers = ["x"];
        datasets.forEach((dataset) => {
          if (dataset.visible) {
            headers.push(dataset.label);
          }
        });

        let csvContent = headers.join(",") + "\n";

        // Get all unique x values
        const allXValues = [
          ...new Set(datasets.flatMap((d) => d.data.map((point) => point.x))),
        ];

        // Create rows
        allXValues.forEach((xValue) => {
          const row = [xValue];
          datasets.forEach((dataset) => {
            if (dataset.visible) {
              const point = dataset.data.find((p) => p.x === xValue);
              row.push(point ? point.y.toString() : "");
            }
          });
          csvContent += row.join(",") + "\n";
        });

        return csvContent;
      } else {
        const lineData = data as LineChartData[];
        let csvContent = "x,y\n";
        lineData.forEach((point) => {
          csvContent += `${point.x},${point.y}\n`;
        });
        return csvContent;
      }
    } else {
      const chartData = data as ChartData[];
      let csvContent = "label,value\n";
      chartData.forEach((item) => {
        csvContent += `${item.label},${item.value}\n`;
      });
      return csvContent;
    }
  };

  // Convert data to JSON
  const convertToJSON = (): string => {
    if (isMultiDataset) {
      // For multi-dataset, export only the data points, not the full dataset structure
      const datasets = data as Dataset[];
      const exportData = datasets
        .filter((d) => d.visible)
        .map((dataset) => ({
          label: dataset.label,
          data: dataset.data,
        }));
      return JSON.stringify(exportData, null, 2);
    } else {
      return JSON.stringify(data, null, 2);
    }
  };

  // Export as CSV
  const exportAsCSV = () => {
    const csvContent = convertToCSV();
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chart_data.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export as JSON
  const exportAsJSON = () => {
    const jsonContent = convertToJSON();
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chart_data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import functionality
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let parsedData: ChartData[] | LineChartData[];

        if (file.name.endsWith(".csv")) {
          parsedData = parseCSV(content);
        } else if (file.name.endsWith(".json")) {
          parsedData = parseJSON(content);
        } else {
          throw new Error("Unsupported file format. Please use CSV or JSON.");
        }

        if (parsedData.length === 0) {
          throw new Error("No valid data found in the file.");
        }

        // Use the appropriate callback
        if (isMultiDataset && onDatasetChange) {
          // For multi-dataset, create a new dataset with the imported data
          const newDataset: Dataset = {
            id: Date.now().toString(),
            label: "Imported Data",
            data: parsedData as LineChartData[],
            color: "#3B82F6",
            visible: true,
            strokeWidth: 2,
            opacity: 0.8,
          };
          onDatasetChange([newDataset]);
        } else if (onDataChange) {
          onDataChange(parsedData);
        }

        showNotification(`Data imported successfully! ${parsedData.length} items processed.`, "success");
      } catch (error) {
        console.error("Error importing data:", error);
        showNotification(
          error instanceof Error ? error.message : "Error importing data",
          "error"
        );
      }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = "";
  };

  // Copy data to clipboard
  const copyData = async () => {
    try {
      const jsonContent = convertToJSON();
      await navigator.clipboard.writeText(jsonContent);
      showNotification("Data copied to clipboard!", "success");
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = convertToJSON();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showNotification("Data copied to clipboard!", "success");
      } catch (fallbackError) {
        showNotification("Error copying data to clipboard", "error");
      }
    }
  };

  // Paste data from clipboard or manual input
  const pasteData_func = async () => {
    try {
      const clipboardData = await navigator.clipboard.readText();
      setPasteData(clipboardData);
      setShowPasteModal(true);
    } catch (error) {
      // If clipboard access fails, just open the modal for manual paste
      setShowPasteModal(true);
    }
  };

  // Process pasted data
  const processPastedData = () => {
    if (!pasteData.trim()) return;

    try {
      let parsedData: ChartData[] | LineChartData[];

      // Try to determine if it's CSV or JSON
      if (
        pasteData.trim().startsWith("[") ||
        pasteData.trim().startsWith("{")
      ) {
        // Looks like JSON
        parsedData = parseJSON(pasteData);
      } else {
        // Assume CSV
        parsedData = parseCSV(pasteData);
      }

      if (parsedData.length === 0) {
        throw new Error("No valid data found in the pasted content.");
      }

      // Use the appropriate callback
      if (isMultiDataset && onDatasetChange) {
        // For multi-dataset, create a new dataset with the pasted data
        const newDataset: Dataset = {
          id: Date.now().toString(),
          label: "Pasted Data",
          data: parsedData as LineChartData[],
          color: "#3B82F6",
          visible: true,
          strokeWidth: 2,
          opacity: 0.8,
        };
        onDatasetChange([newDataset]);
      } else if (onDataChange) {
        onDataChange(parsedData);
      }

      showNotification(`Data pasted successfully! ${parsedData.length} items processed.`, "success");
      setShowPasteModal(false);
      setPasteData("");
    } catch (error) {
      console.error("Error processing pasted data:", error);
      showNotification(
        error instanceof Error ? error.message : "Error processing pasted data",
        "error"
      );
    }
  };

  // Show notification if neither callback is provided
  if (!onDataChange && !onDatasetChange) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 font-['Figtree']">
          Data actions unavailable
        </span>
      </div>
    );
  }

  // Notification helper
  const showNotification = (message: string, type: "success" | "error") => {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg font-['Figtree'] text-sm max-w-sm ${
      type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  const buttons = [
    {
      key: "paste",
      onClick: pasteData_func,
      title: "Paste chart data from clipboard",
      icon: <Clipboard size={14} />,
      label: "Paste",
    },
    {
      key: "copy",
      onClick: copyData,
      title: "Copy chart data to clipboard",
      icon: <Copy size={14} />,
      label: "Copy",
    },
    {
      key: "csv",
      onClick: exportAsCSV,
      title: "Export chart data as CSV",
      icon: <Download size={14} />,
      label: "CSV",
    },
    {
      key: "json",
      onClick: exportAsJSON,
      title: "Export chart data as JSON",
      icon: <Download size={14} />,
      label: "JSON",
    },
  ];

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Import */}
        <input
          type="file"
          accept=".json,.csv"
          onChange={importData}
          className="hidden"
          id="import-chart-data"
        />
        <label
          htmlFor="import-chart-data"
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 rounded-lg transition-colors cursor-pointer font-['Figtree']"
          title="Import chart data from CSV or JSON file"
        >
          <Upload size={14} />
          Import
        </label>

        {/* Action Buttons */}
        {buttons.map(({ key, onClick, title, icon, label }) => (
          <button
            key={key}
            onClick={onClick}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-['Figtree']"
            title={title}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Paste Data Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 font-['Figtree']">
              Paste Chart Data
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-['Figtree'] space-y-2">
              <div><strong>Examples:</strong></div>
              <div>• Any property names: [{"{"}"name":"A","count":100{"}"}] OR [{"{"}"month":"Jan","sales":150{"}"}]</div>
              <div>• Order doesn't matter: [{"{"}"count":100,"name":"A"{"}"}] also works</div>
            </div>
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder={`Example formats: [{"month":"Jan","sales":200},{"month":"Feb","sales":250}]`}
              className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-['Figtree'] text-sm resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteData("");
                }}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors font-['Figtree']"
              >
                Cancel
              </button>
              <button
                onClick={processPastedData}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-['Figtree']"
              >
                Apply Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataActions;