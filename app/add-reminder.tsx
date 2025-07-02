import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Reminder } from '../src/utils/types';
import { StorageService } from '../src/utils/storage';
import { NotificationService } from '../src/utils/notifications';
import { useTheme } from '../src/utils/theme';

export default function AddReminderScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [task, setTask] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const nextMinute = new Date();
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);
    nextMinute.setSeconds(0);
    nextMinute.setMilliseconds(0);
    return nextMinute;
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    const nextMinute = new Date();
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);
    nextMinute.setSeconds(0);
    nextMinute.setMilliseconds(0);
    return nextMinute;
  });
  const [isCritical, setIsCritical] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const combineDateTime = () => {
    const combined = new Date(selectedDate);
    combined.setHours(selectedTime.getHours());
    combined.setMinutes(selectedTime.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined;
  };

  const validateForm = () => {
    if (!task.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return false;
    }

    const targetDateTime = combineDateTime();
    if (targetDateTime.getTime() <= Date.now()) {
      Alert.alert('Error', 'Please select a future date and time');
      return false;
    }

    return true;
  };

  const saveReminder = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const targetDateTime = combineDateTime();
      
      const newReminder: Reminder = {
        id: generateId(),
        task: task.trim(),
        targetTimestamp: targetDateTime.getTime(),
        isCritical,
        status: 'upcoming',
        recurrence: {
          type: recurrenceType,
        },
        createdAt: Date.now(),
      };

      await StorageService.addReminder(newReminder);
      
      // Schedule notification (skip on web as notifications work differently)
      if (Platform.OS !== 'web') {
        await NotificationService.scheduleReminder(newReminder);
      }

      if (Platform.OS === 'web') {
        alert('Reminder saved successfully!');
        router.back();
      } else {
        Alert.alert(
          'Success',
          'Reminder saved successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Error', 'Failed to save reminder. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const RecurrenceOption = ({ type, label, selected, onPress }: {
    type: string;
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.recurrenceOption, selected && styles.recurrenceOptionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.recurrenceText, selected && styles.recurrenceTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Reminder</Text>
        <TouchableOpacity
          onPress={saveReminder}
          disabled={saving}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        >
          <Text style={[styles.saveButtonText, saving && styles.saveButtonTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Task Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What do you need to be reminded about?</Text>
          <TextInput
            style={styles.taskInput}
            placeholder="e.g., Take medication, Call mom, Meeting with John"
            value={task}
            onChangeText={setTask}
            multiline
            autoFocus
            returnKeyType="done"
          />
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When?</Text>
          
          {/* Date Button/Input */}
          {Platform.OS === 'web' ? (
            <View style={styles.dateTimeButton}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(new Date(e.target.value));
                  }
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: 16,
                  color: theme.colors.text,
                  marginLeft: 12,
                  outline: 'none',
                  flex: 1,
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.dateTimeText}>
                {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}

          {/* Time Button/Input */}
          {Platform.OS === 'web' ? (
            <View style={styles.dateTimeButton}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <input
                type="time"
                value={selectedTime.toTimeString().slice(0, 5)}
                onChange={(e) => {
                  if (e.target.value) {
                    const [hours, minutes] = e.target.value.split(':');
                    const newTime = new Date(selectedTime);
                    newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    setSelectedTime(newTime);
                  }
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: 16,
                  color: theme.colors.text,
                  marginLeft: 12,
                  outline: 'none',
                  flex: 1,
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.dateTimeText}>
                {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          )}

          {/* Native Date Picker */}
          {showDatePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event, date) => {
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }
                if (event.type === 'set' && date) {
                  setSelectedDate(date);
                  if (Platform.OS === 'ios') {
                    setShowDatePicker(false);
                  }
                } else if (event.type === 'dismissed') {
                  setShowDatePicker(false);
                }
              }}
            />
          )}

          {/* Native Time Picker */}
          {showTimePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, time) => {
                if (Platform.OS === 'android') {
                  setShowTimePicker(false);
                }
                if (event.type === 'set' && time) {
                  setSelectedTime(time);
                  if (Platform.OS === 'ios') {
                    setShowTimePicker(false);
                  }
                } else if (event.type === 'dismissed') {
                  setShowTimePicker(false);
                }
              }}
            />
          )}
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repeat</Text>
          <View style={styles.recurrenceContainer}>
            <RecurrenceOption
              type="none"
              label="Never"
              selected={recurrenceType === 'none'}
              onPress={() => setRecurrenceType('none')}
            />
            <RecurrenceOption
              type="daily"
              label="Daily"
              selected={recurrenceType === 'daily'}
              onPress={() => setRecurrenceType('daily')}
            />
            <RecurrenceOption
              type="weekly"
              label="Weekly"
              selected={recurrenceType === 'weekly'}
              onPress={() => setRecurrenceType('weekly')}
            />
            <RecurrenceOption
              type="monthly"
              label="Monthly"
              selected={recurrenceType === 'monthly'}
              onPress={() => setRecurrenceType('monthly')}
            />
          </View>
        </View>

        {/* Critical Toggle */}
        <View style={styles.section}>
          <View style={styles.criticalRow}>
            <View style={styles.criticalLeft}>
              <Text style={styles.sectionTitle}>Critical Alarm</Text>
              <Text style={styles.criticalSubtitle}>
                Override silent mode and Do Not Disturb
              </Text>
            </View>
            <Switch
              value={isCritical}
              onValueChange={setIsCritical}
              trackColor={{ false: theme.colors.border, true: '#fca5a5' }}
              thumbColor={isCritical ? '#ef4444' : theme.colors.textSecondary}
            />
          </View>
        </View>
      </ScrollView>

      {/* Simple date/time input - will be enhanced later with proper picker */}
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: theme.colors.border,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  taskInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateTimeText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  recurrenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurrenceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recurrenceOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  recurrenceText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  recurrenceTextSelected: {
    color: 'white',
  },
  criticalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  criticalLeft: {
    flex: 1,
  },
  criticalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
}); 