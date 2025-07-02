import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Reminder } from '../../src/utils/types';
import { StorageService } from '../../src/utils/storage';
import { NotificationService } from '../../src/utils/notifications';
import ReminderItem from '../../src/components/ReminderItem';
import DeleteToast from '../../src/components/DeleteToast';
import { useTheme } from '../../src/utils/theme';

export default function HomeScreen() {
  const { theme } = useTheme();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteToast, setDeleteToast] = useState<{
    visible: boolean;
    reminder: Reminder | null;
    message: string;
  }>({
    visible: false,
    reminder: null,
    message: '',
  });
  const router = useRouter();

  const loadReminders = async () => {
    try {
      const allReminders = await StorageService.getReminders();
      const upcomingReminders = allReminders
        .filter(r => r.status === 'upcoming')
        .sort((a, b) => a.targetTimestamp - b.targetTimestamp);
      setReminders(upcomingReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', 'Failed to load reminders');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  const handleDeleteReminder = async (id: string) => {
    if (Platform.OS === 'web') {
      // Web: Show toast with undo functionality
      const reminderToDelete = reminders.find(r => r.id === id);
      if (reminderToDelete) {
        try {
          // Delete immediately but show toast for undo
          await StorageService.deleteReminder(id);
          await loadReminders();
          
          // Show toast with undo option
          setDeleteToast({
            visible: true,
            reminder: reminderToDelete,
            message: 'Reminder deleted',
          });
        } catch (error) {
          console.error('Error deleting reminder:', error);
          alert('Failed to delete reminder');
        }
      }
    } else {
      // Mobile: Use native Alert with multiple buttons
      Alert.alert(
        'Delete Reminder',
        'Are you sure you want to delete this reminder?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await StorageService.deleteReminder(id);
                await loadReminders();
              } catch (error) {
                console.error('Error deleting reminder:', error);
                Alert.alert('Error', 'Failed to delete reminder');
              }
            },
          },
        ]
      );
    }
  };

  const handleUndoDelete = async () => {
    if (deleteToast.reminder) {
      try {
        // Restore the reminder
        await StorageService.addReminder(deleteToast.reminder);
        await loadReminders();
        
        // Hide the toast
        setDeleteToast({
          visible: false,
          reminder: null,
          message: '',
        });
      } catch (error) {
        console.error('Error restoring reminder:', error);
        alert('Failed to restore reminder');
      }
    }
  };

  const handleDismissToast = () => {
    setDeleteToast({
      visible: false,
      reminder: null,
      message: '',
    });
  };

  const handleEditReminder = (reminder: Reminder) => {
    router.push({
      pathname: '/edit-reminder',
      params: { reminderId: reminder.id },
    });
  };

  const handleCompleteReminder = async (id: string) => {
    try {
      await StorageService.completeReminder(id);
      // Cancel all notifications and reschedule remaining ones (skip on web)
      if (Platform.OS !== 'web') {
        await NotificationService.cancelAllReminders();
        const updatedReminders = await StorageService.getReminders();
        const upcomingReminders = updatedReminders.filter(r => r.status === 'upcoming');
        for (const reminder of upcomingReminders) {
          await NotificationService.scheduleReminder(reminder);
        }
      }
      await loadReminders();
      Alert.alert('✅ Complete!', 'Reminder marked as completed');
    } catch (error) {
      console.error('Error completing reminder:', error);
      Alert.alert('Error', 'Failed to complete reminder');
    }
  };

  const containerStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
  };

  const headerStyle = {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  };

  const titleStyle = {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
  };

  const subtitleStyle = {
    color: theme.colors.textSecondary,
    marginTop: 4,
  };

  return (
    <SafeAreaView style={containerStyle}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={headerStyle}>
          <Text style={titleStyle}>VocaliZeit</Text>
          <Text style={subtitleStyle}>Your voice-powered reminders</Text>
        </View>

        {/* Reminders List */}
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {reminders.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
              <Ionicons name="notifications-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={{ fontSize: 18, color: theme.colors.textSecondary, marginTop: 16, textAlign: 'center' }}>
                No reminders yet
              </Text>
              <Text style={{ color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
                Tap the + button to create your first voice reminder
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              {reminders.map((reminder) => (
                <ReminderItem
                  key={reminder.id}
                  reminder={reminder}
                  onEdit={handleEditReminder}
                  onDelete={handleDeleteReminder}
                  onComplete={handleCompleteReminder}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            backgroundColor: theme.colors.primary,
            borderRadius: 28,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => router.push('/add-reminder')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

        {/* Delete Toast - Web only */}
        {Platform.OS === 'web' && (
          <DeleteToast
            visible={deleteToast.visible}
            message={deleteToast.message}
            onUndo={handleUndoDelete}
            onDismiss={handleDismissToast}
          />
        )}
      </View>
    </SafeAreaView>
  );
} 