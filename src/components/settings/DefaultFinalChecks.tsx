import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { SettingsService } from '../../services/settings.service';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface DefaultFinalChecksProps {
  className?: string;
}

export const DefaultFinalChecks: React.FC<DefaultFinalChecksProps> = ({ className = '' }) => {
  const { defaultFinalChecks, setDefaultFinalChecks } = useSettings();
  const { handleError } = useErrorHandler();
  
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [newCheckValue, setNewCheckValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await SettingsService.getSettings();
      setDefaultFinalChecks(settings.defaultFinalChecks);
    } catch (error) {
      handleError(error as Error, 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCheck = async () => {
    if (!newCheckValue.trim()) {
      setValidationError('Final check cannot be empty');
      return;
    }

    const validation = SettingsService.validateFinalCheck(newCheckValue);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid final check');
      return;
    }

    try {
      setIsLoading(true);
      setValidationError(null);
      const updatedChecks = await SettingsService.addDefaultFinalCheck(newCheckValue);
      setDefaultFinalChecks(updatedChecks);
      setNewCheckValue('');
      setIsAddingNew(false);
    } catch (error) {
      handleError(error as Error, 'Failed to add final check');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCheck = async (check: string) => {
    if (defaultFinalChecks.length <= 1) {
      setValidationError('At least one final check is required');
      return;
    }

    try {
      setIsLoading(true);
      setValidationError(null);
      const updatedChecks = await SettingsService.removeDefaultFinalCheck(check);
      setDefaultFinalChecks(updatedChecks);
    } catch (error) {
      handleError(error as Error, 'Failed to remove final check');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCheck = (index: number) => {
    setEditingIndex(index);
    setEditingValue(defaultFinalChecks[index]);
    setValidationError(null);
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null) return;

    const validation = SettingsService.validateFinalCheck(editingValue);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid final check');
      return;
    }

    try {
      setIsLoading(true);
      setValidationError(null);
      const oldCheck = defaultFinalChecks[editingIndex];
      const updatedChecks = await SettingsService.updateDefaultFinalCheck(oldCheck, editingValue);
      setDefaultFinalChecks(updatedChecks);
      setEditingIndex(null);
      setEditingValue('');
    } catch (error) {
      handleError(error as Error, 'Failed to update final check');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
    setValidationError(null);
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset to default final checks? This will replace all current checks.')) {
      return;
    }

    try {
      setIsLoading(true);
      setValidationError(null);
      const defaultChecks = await SettingsService.resetToDefaults();
      setDefaultFinalChecks(defaultChecks);
    } catch (error) {
      handleError(error as Error, 'Failed to reset to defaults');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      if (editingIndex !== null) {
        handleCancelEdit();
      } else if (isAddingNew) {
        setIsAddingNew(false);
        setNewCheckValue('');
        setValidationError(null);
      }
    }
  };

  if (isLoading && defaultFinalChecks.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Default Final Checks</h3>
        <button
          onClick={handleResetToDefaults}
          disabled={isLoading}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Reset to Defaults
        </button>
      </div>

      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{validationError}</p>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {defaultFinalChecks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md">
            {editingIndex === index ? (
              <>
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, handleSaveEdit)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter final check description"
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-700">{check}</span>
                <button
                  onClick={() => handleEditCheck(index)}
                  disabled={isLoading}
                  className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveCheck(check)}
                  disabled={isLoading || defaultFinalChecks.length <= 1}
                  className="px-2 py-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  title={defaultFinalChecks.length <= 1 ? 'At least one final check is required' : 'Remove this check'}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {isAddingNew ? (
        <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50">
          <input
            type="text"
            value={newCheckValue}
            onChange={(e) => setNewCheckValue(e.target.value)}
            onKeyDown={(e) => handleKeyPress(e, handleAddCheck)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new final check description"
            autoFocus
            disabled={isLoading}
          />
          <button
            onClick={handleAddCheck}
            disabled={isLoading}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAddingNew(false);
              setNewCheckValue('');
              setValidationError(null);
            }}
            disabled={isLoading}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingNew(true)}
          disabled={isLoading || defaultFinalChecks.length >= 20}
          className="w-full p-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800 disabled:opacity-50"
          title={defaultFinalChecks.length >= 20 ? 'Maximum 20 final checks allowed' : 'Add new final check'}
        >
          + Add New Final Check
        </button>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>These final checks will be automatically added to new content.</p>
        <p>Changes only affect new content, not existing content.</p>
      </div>
    </div>
  );
};

export default DefaultFinalChecks;