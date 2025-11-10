import { supabase, handleSupabaseError, TABLES } from './supabase';
import { DEFAULT_FINAL_CHECKS } from '../constants';

export interface SettingsData {
  defaultFinalChecks: string[];
}

export class SettingsService {
  private static readonly SETTINGS_KEY = 'default_final_checks';

  /**
   * Get settings from Supabase
   */
  static async getSettings(): Promise<SettingsData> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SETTINGS)
        .select('value')
        .eq('key', this.SETTINGS_KEY)
        .single();

      if (error) {
        // If no settings found, return defaults
        if (error.code === 'PGRST116') {
          return { defaultFinalChecks: DEFAULT_FINAL_CHECKS };
        }
        handleSupabaseError(error);
      }

      return {
        defaultFinalChecks: data?.value?.defaultFinalChecks || DEFAULT_FINAL_CHECKS
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Return defaults on error
      return { defaultFinalChecks: DEFAULT_FINAL_CHECKS };
    }
  }

  /**
   * Save settings to Supabase
   */
  static async saveSettings(settings: SettingsData): Promise<void> {
    try {
      // Validate final checks
      this.validateFinalChecks(settings.defaultFinalChecks);

      const { error } = await supabase
        .from(TABLES.SETTINGS)
        .upsert({
          key: this.SETTINGS_KEY,
          value: settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Update default final checks
   */
  static async updateDefaultFinalChecks(finalChecks: string[]): Promise<void> {
    const settings: SettingsData = { defaultFinalChecks: finalChecks };
    await this.saveSettings(settings);
  }

  /**
   * Add a new default final check
   */
  static async addDefaultFinalCheck(check: string): Promise<string[]> {
    const currentSettings = await this.getSettings();
    const trimmedCheck = check.trim();
    
    if (!trimmedCheck) {
      throw new Error('Final check cannot be empty');
    }

    if (currentSettings.defaultFinalChecks.includes(trimmedCheck)) {
      throw new Error('Final check already exists');
    }

    const updatedChecks = [...currentSettings.defaultFinalChecks, trimmedCheck];
    await this.updateDefaultFinalChecks(updatedChecks);
    return updatedChecks;
  }

  /**
   * Remove a default final check
   */
  static async removeDefaultFinalCheck(check: string): Promise<string[]> {
    const currentSettings = await this.getSettings();
    const updatedChecks = currentSettings.defaultFinalChecks.filter(c => c !== check);
    
    if (updatedChecks.length === currentSettings.defaultFinalChecks.length) {
      throw new Error('Final check not found');
    }

    await this.updateDefaultFinalChecks(updatedChecks);
    return updatedChecks;
  }

  /**
   * Update an existing default final check
   */
  static async updateDefaultFinalCheck(oldCheck: string, newCheck: string): Promise<string[]> {
    const currentSettings = await this.getSettings();
    const trimmedNewCheck = newCheck.trim();
    
    if (!trimmedNewCheck) {
      throw new Error('Final check cannot be empty');
    }

    const checkIndex = currentSettings.defaultFinalChecks.indexOf(oldCheck);
    if (checkIndex === -1) {
      throw new Error('Original final check not found');
    }

    // Check if new check already exists (but not at the same position)
    const existingIndex = currentSettings.defaultFinalChecks.indexOf(trimmedNewCheck);
    if (existingIndex !== -1 && existingIndex !== checkIndex) {
      throw new Error('Final check already exists');
    }

    const updatedChecks = [...currentSettings.defaultFinalChecks];
    updatedChecks[checkIndex] = trimmedNewCheck;
    
    await this.updateDefaultFinalChecks(updatedChecks);
    return updatedChecks;
  }

  /**
   * Reset default final checks to system defaults
   */
  static async resetToDefaults(): Promise<string[]> {
    await this.updateDefaultFinalChecks(DEFAULT_FINAL_CHECKS);
    return DEFAULT_FINAL_CHECKS;
  }

  /**
   * Validate final checks array
   */
  private static validateFinalChecks(finalChecks: string[]): void {
    if (!Array.isArray(finalChecks)) {
      throw new Error('Final checks must be an array');
    }

    if (finalChecks.length === 0) {
      throw new Error('At least one final check is required');
    }

    if (finalChecks.length > 20) {
      throw new Error('Maximum 20 final checks allowed');
    }

    // Check for empty or invalid checks
    for (const check of finalChecks) {
      if (typeof check !== 'string' || !check.trim()) {
        throw new Error('All final checks must be non-empty strings');
      }

      if (check.length > 200) {
        throw new Error('Final check description cannot exceed 200 characters');
      }
    }

    // Check for duplicates
    const uniqueChecks = new Set(finalChecks.map(check => check.trim()));
    if (uniqueChecks.size !== finalChecks.length) {
      throw new Error('Duplicate final checks are not allowed');
    }
  }

  /**
   * Validate a single final check
   */
  static validateFinalCheck(check: string): { isValid: boolean; error?: string } {
    try {
      if (typeof check !== 'string') {
        return { isValid: false, error: 'Final check must be a string' };
      }

      const trimmedCheck = check.trim();
      if (!trimmedCheck) {
        return { isValid: false, error: 'Final check cannot be empty' };
      }

      if (trimmedCheck.length > 200) {
        return { isValid: false, error: 'Final check cannot exceed 200 characters' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid final check format' };
    }
  }
}