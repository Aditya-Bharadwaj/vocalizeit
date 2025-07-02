import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Reminder } from '../src/utils/types';
import { StorageService } from '../src/utils/storage';
import { NotificationService } from '../src/utils/notifications';
import { useTheme } from '../src/utils/theme';

const { width, height } = Dimensions.get('window');

export default function AlarmScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { reminderId } = useLocalSearchParams();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    loadReminder();
  }, [reminderId]);

  useEffect(() => {
    if (reminder) {
      speakTask();
    }
  }, [reminder]);

  const loadReminder = async () => {
    if (typeof reminderId === 'string') {
      try {
        const reminderData = await StorageService.getReminderById(reminderId);
        setReminder(reminderData);
      } catch (error) {
        console.error('Error loading reminder:', error);
        router.back();
      }
    }
  };

  const speakTask = async () => {
    if (!reminder) return;
    
    setSpeaking(true);
    try {
      await Speech.speak(reminder.task, {
        language: 'en',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    } catch (error) {
      console.error('Error speaking task:', error);
      setSpeaking(false);
    }
  };

  const handleComplete = async () => {
    if (!reminder) return;

    try {
      await StorageService.completeReminder(reminder.id);
      
      Alert.alert(
        '✅ Completed!',
        'Reminder marked as completed!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error completing reminder:', error);
      Alert.alert('Error', 'Failed to complete reminder');
    }
  };

  const handleSnooze = async () => {
    if (!reminder) return;

    try {
      const settings = await StorageService.getSettings();
      const snoozeTime = settings.snoozeDuration * 60 * 1000; // Convert to milliseconds
      const newTargetTime = Date.now() + snoozeTime;

      const updatedReminder: Reminder = {
        ...reminder,
        targetTimestamp: newTargetTime,
      };
      
      await StorageService.updateReminder(updatedReminder);
      
      // Reschedule the notification for the new time (skip on web)
      if (Platform.OS !== 'web') {
        await NotificationService.scheduleReminder(updatedReminder);
      }
      
      Alert.alert(
        '⏰ Snoozed',
        `Reminder snoozed for ${settings.snoozeDuration} minutes`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      Alert.alert('Error', 'Failed to snooze reminder');
    }
  };

  const handleDismiss = async () => {
    if (!reminder) return;

    try {
      const updatedReminder: Reminder = {
        ...reminder,
        status: 'dismissed',
      };
      await StorageService.updateReminder(updatedReminder);
      
      router.back();
    } catch (error) {
      console.error('Error dismissing reminder:', error);
      Alert.alert('Error', 'Failed to dismiss reminder');
    }
  };

  const styles = getStyles(theme);

  if (!reminder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading reminder...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, reminder.isCritical && styles.criticalContainer]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>VocaliZeit</Text>
          <Text style={styles.time}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={reminder.isCritical ? "warning" : "notifications"} 
              size={80} 
              color={reminder.isCritical ? "#ef4444" : theme.colors.primary} 
            />
          </View>

          <Text style={styles.taskText}>{reminder.task}</Text>

          {reminder.isCritical && (
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalText}>CRITICAL REMINDER</Text>
            </View>
          )}

          {speaking && (
            <View style={styles.speakingIndicator}>
              <Ionicons name="volume-high" size={24} color={theme.colors.primary} />
              <Text style={styles.speakingText}>Speaking...</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.completeButton]}
            onPress={handleComplete}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.buttonText}>Complete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.snoozeButton]}
            onPress={handleSnooze}
          >
            <Ionicons name="time" size={24} color="white" />
            <Text style={styles.buttonText}>Snooze</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={handleDismiss}
          >
            <Ionicons name="close-circle" size={24} color="white" />
            <Text style={styles.buttonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>

        {/* Repeat Speech Button */}
        <TouchableOpacity
          style={styles.repeatButton}
          onPress={speakTask}
          disabled={speaking}
        >
          <Ionicons name="repeat" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.repeatButtonText}>
            {speaking ? 'Speaking...' : 'Repeat'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  criticalContainer: {
    backgroundColor: theme.name === 'light' ? '#fef2f2' : theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  time: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  taskText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 32,
  },
  criticalBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  criticalText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.name === 'light' ? '#eff6ff' : theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  speakingText: {
    color: theme.colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  completeButton: {
    backgroundColor: '#16a34a',
  },
  snoozeButton: {
    backgroundColor: '#d97706',
  },
  dismissButton: {
    backgroundColor: theme.colors.textSecondary,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  repeatButtonText: {
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
}); 