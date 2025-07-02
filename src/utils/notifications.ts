import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { Reminder, NotificationData } from './types';
import { StorageService } from './storage';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Configure notifications for critical alerts
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('Notification received:', notification);
    
    // Immediately trigger TTS when notification is received
    const reminderId = notification.request.content.data?.reminderId;
    if (reminderId) {
      try {
        const reminder = await StorageService.getReminderById(reminderId);
        if (reminder) {
          console.log('Speaking task:', reminder.task);
          // Stop any current speech and speak the task immediately
          Speech.stop();
          Speech.speak(reminder.task, {
            language: 'en',
            pitch: 1.0,
            rate: 0.8,
          });
        }
      } catch (error) {
        console.error('Error speaking notification:', error);
      }
    }

    // Always show alert and play sound for critical timing
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

// Background task for handling notifications
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error, executionInfo }) => {
  console.log('Background notification task executed:', { data, error, executionInfo });
  
  if (error) {
    console.error('Background notification task error:', error);
    return;
  }

  if (data) {
    handleBackgroundNotification(data);
  }
});

async function handleBackgroundNotification(data: any) {
  try {
    console.log('Handling background notification:', data);
    const reminderId = data.reminderId;
    if (!reminderId) return;

    const reminder = await StorageService.getReminderById(reminderId);
    if (!reminder) return;

    // Speak the task in background
    try {
      await Speech.speak(reminder.task, {
        language: 'en',
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (speechError) {
      console.error('Background speech error:', speechError);
    }

    // Schedule next occurrence if recurring
    if (reminder.recurrence.type !== 'none') {
      await scheduleNextRecurrence(reminder);
    }
  } catch (error) {
    console.error('Error handling background notification:', error);
  }
}

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    try {
      // Request all notification permissions including critical alerts
      const permissionRequest: any = {
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
          allowCriticalAlerts: true, // Critical for overriding silent mode
          providesAppNotificationSettings: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      };

      const { status } = await Notifications.requestPermissionsAsync(permissionRequest);
      
      if (status !== 'granted') {
        console.warn('Notification permission not granted:', status);
        return false;
      }

      // Set up Android notification channels
      if (Platform.OS === 'android') {
        // Default channel
        await Notifications.setNotificationChannelAsync('default', {
          name: 'VocaliZeit Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3b82f6',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          enableLights: true,
        });

        // Critical channel for override reminders
        await Notifications.setNotificationChannelAsync('critical', {
          name: 'Critical Reminders',
          description: 'Critical reminders that bypass Do Not Disturb',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 100, 100, 100, 100, 100, 100, 100],
          lightColor: '#ef4444',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          enableLights: true,
          bypassDnd: true, // Bypass Do Not Disturb
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        // Alarm channel for maximum priority
        await Notifications.setNotificationChannelAsync('alarm', {
          name: 'Alarm Notifications',
          description: 'Full-screen alarms for critical reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 200, 200, 200, 200, 200],
          lightColor: '#ef4444',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          enableLights: true,
          bypassDnd: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      // Set up iOS notification categories
      if (Platform.OS === 'ios') {
        await Notifications.setNotificationCategoryAsync('reminder', [
          {
            identifier: 'complete',
            buttonTitle: 'Complete',
            options: { isDestructive: false, isAuthenticationRequired: false },
          },
          {
            identifier: 'snooze',
            buttonTitle: 'Snooze',
            options: { isDestructive: false, isAuthenticationRequired: false },
          },
        ]);

        await Notifications.setNotificationCategoryAsync('critical-reminder', [
          {
            identifier: 'complete',
            buttonTitle: 'Complete',
            options: { isDestructive: false, isAuthenticationRequired: false },
          },
          {
            identifier: 'snooze',
            buttonTitle: 'Snooze',
            options: { isDestructive: false, isAuthenticationRequired: false },
          },
        ], {
          // Critical alert options
          allowInCarPlay: true,
          allowAnnouncement: true,
          intentIdentifiers: [],
        });
      }

      console.log('Notification permissions and channels set up successfully');
      return true;
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return false;
    }
  },

  async scheduleReminder(reminder: Reminder): Promise<string> {
    try {
      const notificationData: NotificationData = {
        reminderId: reminder.id,
        task: reminder.task,
        isCritical: reminder.isCritical,
      };

      // Use exact timestamp for precise timing
      const trigger = new Date(reminder.targetTimestamp);
      const now = new Date();
      
      // Ensure the trigger is in the future
      if (trigger.getTime() <= now.getTime()) {
        throw new Error('Cannot schedule notification in the past');
      }

      console.log(`Scheduling notification for: ${trigger.toISOString()}`);

      const notificationConfig: any = {
        content: {
          title: reminder.isCritical ? '🚨 CRITICAL REMINDER' : '⏰ VocaliZeit Reminder',
          body: reminder.task,
          data: notificationData,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          sticky: reminder.isCritical,
          autoDismiss: !reminder.isCritical,
        },
        trigger,
      };

      // Platform-specific configuration
      if (Platform.OS === 'android') {
        notificationConfig.content.channelId = reminder.isCritical ? 'critical' : 'default';
        
        if (reminder.isCritical) {
          // Full-screen intent for critical reminders
          notificationConfig.content.fullScreenIntent = {
            category: 'alarm',
            priority: 'max',
          };
        }
      } else if (Platform.OS === 'ios') {
        notificationConfig.content.categoryIdentifier = reminder.isCritical ? 'critical-reminder' : 'reminder';
        
        if (reminder.isCritical) {
          // Critical alert for iOS
          notificationConfig.content.criticalAlert = {
            name: 'default',
            volume: 1.0,
          };
          notificationConfig.content.interruptionLevel = 'critical';
        }
      }

      const notificationId = await Notifications.scheduleNotificationAsync(notificationConfig);
      console.log(`Notification scheduled with ID: ${notificationId}`);
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  },

  async cancelReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled notification: ${notificationId}`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  },

  async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  },

  async registerForPushNotificationsAsync(): Promise<string | undefined> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Permission not granted for push notifications');
        return undefined;
      }

      // Register background task for notifications
      const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK);
      if (!isTaskDefined) {
        console.warn('Background notification task not defined');
      } else {
        console.log('Background notification task registered');
      }

      console.log('Push notification service initialized');
      return 'registered';
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return undefined;
    }
  },

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },

  async testNotification(reminder: Reminder): Promise<void> {
    try {
      // Schedule a test notification 5 seconds from now
      const testReminder = {
        ...reminder,
        targetTimestamp: Date.now() + 5000,
      };
      
      await this.scheduleReminder(testReminder);
      console.log('Test notification scheduled for 5 seconds from now');
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  },
};

async function scheduleNextRecurrence(reminder: Reminder): Promise<void> {
  try {
    const now = Date.now();
    let nextTimestamp = reminder.targetTimestamp;

    switch (reminder.recurrence.type) {
      case 'daily':
        nextTimestamp = reminder.targetTimestamp + (24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextTimestamp = reminder.targetTimestamp + (7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        const date = new Date(reminder.targetTimestamp);
        date.setMonth(date.getMonth() + 1);
        nextTimestamp = date.getTime();
        break;
    }

    if (nextTimestamp > now) {
      const updatedReminder: Reminder = {
        ...reminder,
        targetTimestamp: nextTimestamp,
        status: 'upcoming',
      };
      
      await StorageService.updateReminder(updatedReminder);
      await NotificationService.scheduleReminder(updatedReminder);
      console.log(`Next recurrence scheduled for: ${new Date(nextTimestamp).toISOString()}`);
    }
  } catch (error) {
    console.error('Error scheduling next recurrence:', error);
  }
} 