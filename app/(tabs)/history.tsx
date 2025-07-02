import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Reminder } from '../../src/utils/types';
import { StorageService } from '../../src/utils/storage';
import { useTheme } from '../../src/utils/theme';

export default function HistoryScreen() {
  const { theme } = useTheme();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const allReminders = await StorageService.getReminders();
      const historyReminders = allReminders
        .filter(r => r.status !== 'upcoming')
        .sort((a, b) => b.targetTimestamp - a.targetTimestamp);
      setReminders(historyReminders);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'dismissed': return '#d97706';
      case 'missed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'dismissed': return 'close-circle';
      case 'missed': return 'warning';
      default: return 'help-circle';
    }
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Past 90 days of reminders</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySubtitle}>
              Your completed and missed reminders will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {reminders.map((reminder) => (
              <View key={reminder.id} style={styles.historyItem}>
                <View style={styles.statusIndicator}>
                  <Ionicons 
                    name={getStatusIcon(reminder.status)} 
                    size={20} 
                    color={getStatusColor(reminder.status)} 
                  />
                </View>
                <View style={styles.reminderContent}>
                  <Text style={styles.taskText}>{reminder.task}</Text>
                  <Text style={styles.dateText}>
                    {formatDateTime(reminder.targetTimestamp)}
                  </Text>
                  <View style={styles.statusRow}>
                    <Text style={[styles.statusText, { color: getStatusColor(reminder.status) }]}>
                      {reminder.status.toUpperCase()}
                    </Text>
                    {reminder.isCritical && (
                      <View style={styles.criticalBadge}>
                        <Text style={styles.criticalText}>CRITICAL</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    opacity: 0.7,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.name === 'light' ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.name === 'light' ? 0.1 : 0,
    shadowRadius: 3,
    elevation: theme.name === 'light' ? 2 : 0,
    borderWidth: theme.name === 'light' ? 0 : 1,
    borderColor: theme.colors.border,
  },
  statusIndicator: {
    marginRight: 12,
    justifyContent: 'center',
  },
  reminderContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  criticalBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  criticalText: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '600',
  },
}); 