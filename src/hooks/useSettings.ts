import { useCallback, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { SettingsService } from '../services/settings.service';

export const useSettings = () => {
  const { state, dispatch } = useAppContext();

  // Load settings from Supabase on hook initialization
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await SettingsService.getSettings();
        dispatch({ type: 'SET_DEFAULT_FINAL_CHECKS', payload: settings.defaultFinalChecks });
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Keep current state on error
      }
    };

    loadSettings();
  }, [dispatch]);

  const setDefaultFinalChecks = useCallback((checks: string[]) => {
    dispatch({ type: 'SET_DEFAULT_FINAL_CHECKS', payload: checks });
  }, [dispatch]);

  const addDefaultFinalCheck = useCallback(async (check: string) => {
    try {
      const updatedChecks = await SettingsService.addDefaultFinalCheck(check);
      dispatch({ type: 'SET_DEFAULT_FINAL_CHECKS', payload: updatedChecks });
      return updatedChecks;
    } catch (error) {
      console.error('Failed to add final check:', error);
      throw error;
    }
  }, [dispatch]);

  const removeDefaultFinalCheck = useCallback(async (check: string) => {
    try {
      const updatedChecks = await SettingsService.removeDefaultFinalCheck(check);
      dispatch({ type: 'SET_DEFAULT_FINAL_CHECKS', payload: updatedChecks });
      return updatedChecks;
    } catch (error) {
      console.error('Failed to remove final check:', error);
      throw error;
    }
  }, [dispatch]);

  const updateDefaultFinalCheck = useCallback(async (oldCheck: string, newCheck: string) => {
    try {
      const updatedChecks = await SettingsService.updateDefaultFinalCheck(oldCheck, newCheck);
      dispatch({ type: 'SET_DEFAULT_FINAL_CHECKS', payload: updatedChecks });
      return updatedChecks;
    } catch (error) {
      console.error('Failed to update final check:', error);
      throw error;
    }
  }, [dispatch]);

  const resetDefaultFinalChecks = useCallback(async () => {
    try {
      const defaultChecks = await SettingsService.resetToDefaults();
      dispatch({ type: 'SET_DEFAULT_FINAL_CHECKS', payload: defaultChecks });
      return defaultChecks;
    } catch (error) {
      console.error('Failed to reset final checks:', error);
      throw error;
    }
  }, [dispatch]);

  const updateSettings = useCallback((settings: Partial<typeof state.settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, [dispatch]);

  const saveSettings = useCallback(async () => {
    try {
      await SettingsService.saveSettings({
        defaultFinalChecks: state.settings.defaultFinalChecks
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }, [state.settings.defaultFinalChecks]);

  return {
    // State
    defaultFinalChecks: state.settings.defaultFinalChecks,
    
    // Actions
    setDefaultFinalChecks,
    addDefaultFinalCheck,
    removeDefaultFinalCheck,
    updateDefaultFinalCheck,
    resetDefaultFinalChecks,
    updateSettings,
    saveSettings,
  };
};