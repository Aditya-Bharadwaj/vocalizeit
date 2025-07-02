import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reminder } from '../utils/types';
import { useTheme } from '../utils/theme';

interface ReminderItemProps {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

export default function ReminderItem({ reminder, onEdit, onDelete, onComplete }: ReminderItemProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = timestamp - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return 'Overdue';
    } else if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `in ${diffMins} minutes`;
    } else if (diffHours < 24) {
      return `in ${diffHours} hours`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getRecurrenceText = () => {
    const { type, daysOfWeek } = reminder.recurrence;
    switch (type) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return null;
    }
  };

  const isUpcomingSoon = () => {
    const now = Date.now();
    const diffMs = reminder.targetTimestamp - now;
    return diffMs > 0 && diffMs <= (60 * 60 * 1000); // Within 1 hour
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.mainContent,
          reminder.isCritical && styles.criticalBorder,
        ]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          <Text style={styles.taskText} numberOfLines={expanded ? undefined : 2}>
            {reminder.task}
          </Text>
          <View style={styles.metaInfo}>
            <Text style={styles.timeText}>
              {formatDateTime(reminder.targetTimestamp)}
            </Text>
            {reminder.isCritical && (
              <View style={styles.criticalBadge}>
                <Ionicons name="warning" size={12} color="#ef4444" />
                <Text style={styles.criticalText}>Critical</Text>
              </View>
            )}
            {getRecurrenceText() && (
              <View style={styles.recurrenceBadge}>
                <Ionicons name="repeat" size={12} color={theme.colors.textSecondary} />
                <Text style={styles.recurrenceText}>{getRecurrenceText()}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(reminder)}
            >
              <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(reminder.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>

          {isUpcomingSoon() && (
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.preCompleteButton}
                onPress={() => onComplete(reminder.id)}
              >
                <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                <Text style={styles.preCompleteText}>Complete!</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  mainContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.name === 'light' ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.name === 'light' ? 0.1 : 0,
    shadowRadius: 3,
    elevation: theme.name === 'light' ? 2 : 0,
    borderWidth: theme.name === 'light' ? 0 : 1,
    borderColor: theme.colors.border,
  },
  criticalBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  leftContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 12,
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  criticalText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 2,
    fontWeight: '500',
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.name === 'light' ? '#f3f4f6' : theme.colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recurrenceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 2,
  },
  expandedContent: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: theme.name === 'light' ? 0 : 1,
    borderColor: theme.colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.name === 'light' ? '#eff6ff' : theme.colors.border,
    borderRadius: 8,
    marginRight: 12,
  },
  editButtonText: {
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    marginLeft: 4,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  preCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
  },
  preCompleteText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
}); 