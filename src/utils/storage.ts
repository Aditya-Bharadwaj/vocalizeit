import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder, AppSettings } from './types';

const REMINDERS_KEY = 'vocalizeit_reminders';
const SETTINGS_KEY = 'vocalizeit_settings';

const DEFAULT_SETTINGS: AppSettings = {
  snoozeDuration: 15,
  theme: 'system',
};

export const StorageService = {
  // Reminder operations
  async getReminders(): Promise<Reminder[]> {
    try {
      const data = await AsyncStorage.getItem(REMINDERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading reminders:', error);
      return [];
    }
  },

  async saveReminders(reminders: Reminder[]): Promise<void> {
    try {
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
      throw error;
    }
  },

  async addReminder(reminder: Reminder): Promise<void> {
    const reminders = await this.getReminders();
    reminders.push(reminder);
    await this.saveReminders(reminders);
  },

  async updateReminder(updatedReminder: Reminder): Promise<void> {
    const reminders = await this.getReminders();
    const index = reminders.findIndex(r => r.id === updatedReminder.id);
    if (index !== -1) {
      reminders[index] = updatedReminder;
      await this.saveReminders(reminders);
    }
  },

  async deleteReminder(id: string): Promise<void> {
    const reminders = await this.getReminders();
    const filtered = reminders.filter(r => r.id !== id);
    await this.saveReminders(filtered);
  },

  async completeReminder(id: string): Promise<void> {
    const reminders = await this.getReminders();
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      reminders[index] = {
        ...reminders[index],
        status: 'completed',
        completedAt: Date.now(),
      };
      await this.saveReminders(reminders);
    }
  },

  async getReminderById(id: string): Promise<Reminder | null> {
    const reminders = await this.getReminders();
    return reminders.find(r => r.id === id) || null;
  },

  // Settings operations
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },
}; 