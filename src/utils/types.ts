export interface Reminder {
  id: string;
  task: string;
  targetTimestamp: number;
  isCritical: boolean;
  status: 'upcoming' | 'completed' | 'dismissed' | 'missed';
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6, Sunday to Saturday
  };
  createdAt: number;
}

export interface AppSettings {
  snoozeDuration: number; // in minutes
  theme: 'light' | 'dark' | 'amoled' | 'system';
}

export interface NotificationData {
  reminderId: string;
  task: string;
  isCritical: boolean;
} 