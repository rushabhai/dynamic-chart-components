import React, { useState } from 'react';
import { Dataset, LineChartData, ChartConfig } from '../types/ChartTypes';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Copy, 
  Download,
  Upload,
  // BarChart3,
  Settings
} from 'lucide-react';

interface DatasetManagerProps {
  datasets: Dataset[];
  onDatasetsChange: (datasets: Dataset[]) => void;
  config: ChartConfig;
  chartType: 'line' | 'area';
}

const DatasetManager: React.FC<DatasetManagerProps> = ({
  datasets,
  onDatasetsChange,
  // config,
  // chartType
}) => {
  const [selectedDataset, setSelectedDataset] = useState<string>(datasets[0]?.id || '');
  const [editingDataset, setEditingDataset] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>('');
  const [showDatasetSettings, setShowDatasetSettings] = useState<string | null>(null);

  const defaultColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const createNewDataset = (): Dataset => {
    const newId = Date.now().toString();
    const existingColors = datasets.map(d => d.color);
    const availableColor = defaultColors.find(color => !existingColors.includes(color)) || defaultColors[0];
    
    return {
      id: newId,
      label: `Dataset ${datasets.length + 1}`,
      data: generateSampleData(),
      color: availableColor,
      visible: true,
      strokeWidth: 2,
      opacity: 0.8
    };
  };

  const generateSampleData = (): LineChartData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    return months.map(month => ({
      x: month,
      y: Math.floor(Math.random() * 80) + 20
    }));
  };

  const addDataset = () => {
    const newDataset = createNewDataset();
    const updatedDatasets = [...datasets, newDataset];
    onDatasetsChange(updatedDatasets);
    setSelectedDataset(newDataset.id);
  };

  const duplicateDataset = (datasetId: string) => {
    const datasetToDuplicate = datasets.find(d => d.id === datasetId);
    if (!datasetToDuplicate) return;

    const newDataset: Dataset = {
      ...datasetToDuplicate,
      id: Date.now().toString(),
      label: `${datasetToDuplicate.label} (Copy)`,
      data: [...datasetToDuplicate.data]
    };

    const updatedDatasets = [...datasets, newDataset];
    onDatasetsChange(updatedDatasets);
    setSelectedDataset(newDataset.id);
  };

  const removeDataset = (datasetId: string) => {
    if (datasets.length <= 1) return;
    
    const updatedDatasets = datasets.filter(d => d.id !== datasetId);
    onDatasetsChange(updatedDatasets);
    
    if (selectedDataset === datasetId) {
      setSelectedDataset(updatedDatasets[0]?.id || '');
    }
  };

  const updateDataset = (datasetId: string, updates: Partial<Dataset>) => {
    const updatedDatasets = datasets.map(dataset => 
      dataset.id === datasetId ? { ...dataset, ...updates } : dataset
    );
    onDatasetsChange(updatedDatasets);
  };

  const toggleDatasetVisibility = (datasetId: string) => {
    updateDataset(datasetId, { 
      visible: !datasets.find(d => d.id === datasetId)?.visible 
    });
  };

  const startEditingLabel = (datasetId: string, currentLabel: string) => {
    setEditingDataset(datasetId);
    setEditingLabel(currentLabel);
  };

  const confirmEditLabel = () => {
    if (editingDataset) {
      updateDataset(editingDataset, { label: editingLabel });
    }
    setEditingDataset(null);
    setEditingLabel('');
  };

  const cancelEditLabel = () => {
    setEditingDataset(null);
    setEditingLabel('');
  };

  const addDataPoint = (datasetId: string) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    const newPoint: LineChartData = {
      x: `Point ${dataset.data.length + 1}`,
      y: Math.floor(Math.random() * 100)
    };

    updateDataset(datasetId, { 
      data: [...dataset.data, newPoint] 
    });
  };

  const removeDataPoint = (datasetId: string, pointIndex: number) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    const updatedData = dataset.data.filter((_, index) => index !== pointIndex);
    updateDataset(datasetId, { data: updatedData });
  };

  const updateDataPoint = (datasetId: string, pointIndex: number, field: 'x' | 'y', value: string | number) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    const updatedData = dataset.data.map((point, index) => 
      index === pointIndex 
        ? { ...point, [field]: field === 'y' ? (parseFloat(value.toString()) || 0) : value }
        : point
    );

    updateDataset(datasetId, { data: updatedData });
  };

  const generateRandomData = (datasetId: string) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    const randomData = generateSampleData();
    updateDataset(datasetId, { data: randomData });
  };

  const exportDataset = (datasetId: string) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    const dataStr = JSON.stringify(dataset, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataset.label.replace(/\s+/g, '_')}_dataset.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDataset = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedDataset = JSON.parse(e.target?.result as string);
        const newDataset: Dataset = {
          ...importedDataset,
          id: Date.now().toString(),
          label: `${importedDataset.label} (Imported)`
        };
        
        const updatedDatasets = [...datasets, newDataset];
        onDatasetsChange(updatedDatasets);
        setSelectedDataset(newDataset.id);
      } catch (error) {
        console.error('Error importing dataset:', error);
      }
    };
    reader.readAsText(file);
  };

  const currentDataset = datasets.find(d => d.id === selectedDataset);

  return (
    <div className="space-y-6">
      {/* Dataset Overview */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-['Figtree']">
            Dataset Manager
          </h4>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={importDataset}
              className="hidden"
              id="import-dataset"
            />
            <label
              htmlFor="import-dataset"
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors cursor-pointer font-['Figtree']"
            >
              <Upload size={14} />
              Import
            </label>
            <button
              onClick={addDataset}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-['Figtree']"
            >
              <Plus size={14} />
              Add Dataset
            </button>
          </div>
        </div>

        {/* Dataset List */}
        <div className="space-y-2">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedDataset === dataset.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: dataset.visible ? dataset.color : 'transparent' }}
                  />
                  
                  {editingDataset === dataset.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                        autoFocus
                      />
                      <button
                        onClick={confirmEditLabel}
                        className="p-1 text-green-500 hover:text-green-600"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEditLabel}
                        className="p-1 text-red-500 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100 font-['Figtree']">
                        {dataset.label}
                      </span>
                      <button
                        onClick={() => startEditingLabel(dataset.id, dataset.label)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                  
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-['Figtree']">
                    {dataset.data.length} points
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleDatasetVisibility(dataset.id)}
                    className={`p-1.5 rounded transition-colors ${
                      dataset.visible
                        ? 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={dataset.visible ? 'Hide dataset' : 'Show dataset'}
                  >
                    {dataset.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  
                  <button
                    onClick={() => setShowDatasetSettings(showDatasetSettings === dataset.id ? null : dataset.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Dataset settings"
                  >
                    <Settings size={14} />
                  </button>
                  
                  <button
                    onClick={() => duplicateDataset(dataset.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Duplicate dataset"
                  >
                    <Copy size={14} />
                  </button>
                  
                  <button
                    onClick={() => exportDataset(dataset.id)}
                    className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                    title="Export dataset"
                  >
                    <Download size={14} />
                  </button>
                  
                  <button
                    onClick={() => setSelectedDataset(dataset.id)}
                    className={`px-2 py-1 text-sm rounded transition-colors font-['Figtree'] ${
                      selectedDataset === dataset.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {selectedDataset === dataset.id ? 'Selected' : 'Select'}
                  </button>
                  
                  {datasets.length > 1 && (
                    <button
                      onClick={() => removeDataset(dataset.id)}
                      className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remove dataset"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Dataset Settings */}
              {showDatasetSettings === dataset.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                        Color
                      </label>
                      <input
                        type="color"
                        value={dataset.color}
                        onChange={(e) => updateDataset(dataset.id, { color: e.target.value })}
                        className="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                        Stroke Width
                      </label>
                      <input
                        type="number"
                        value={dataset.strokeWidth || 2}
                        onChange={(e) => updateDataset(dataset.id, { strokeWidth: parseInt(e.target.value) || 2 })}
                        min="1"
                        max="8"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-['Figtree']">
                        Opacity
                      </label>
                      <input
                        type="number"
                        value={dataset.opacity || 0.8}
                        onChange={(e) => updateDataset(dataset.id, { opacity: parseFloat(e.target.value) || 0.8 })}
                        min="0.1"
                        max="1"
                        step="0.1"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Dataset Editor */}
      {currentDataset && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-['Figtree']">
              Editing: {currentDataset.label}
            </h5>
            <div className="flex gap-2">
              <button
                onClick={() => generateRandomData(currentDataset.id)}
                className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-['Figtree']"
              >
                Generate Random
              </button>
              <button
                onClick={() => addDataPoint(currentDataset.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-['Figtree']"
              >
                <Plus size={14} />
                Add Point
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {currentDataset.data.map((point, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={point.x}
                    onChange={(e) => updateDataPoint(currentDataset.id, index, 'x', e.target.value)}
                    placeholder="Label"
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                  />
                  <input
                    type="number"
                    value={point.y}
                    onChange={(e) => updateDataPoint(currentDataset.id, index, 'y', e.target.value)}
                    placeholder="Value"
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-['Figtree']"
                  />
                </div>
                <button
                  onClick={() => removeDataPoint(currentDataset.id, index)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetManager;