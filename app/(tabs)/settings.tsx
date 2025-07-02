import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppSettings } from '../../src/utils/types';
import { StorageService } from '../../src/utils/storage';
import { useTheme } from '../../src/utils/theme';
import { NotificationService } from '../../src/utils/notifications';

const SNOOZE_OPTIONS = [5, 10, 15, 20, 30, 60];
const THEME_OPTIONS = [
  { value: 'system', label: 'System Default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'amoled', label: 'AMOLED Dark' },
];

export default function SettingsScreen() {
  const { theme, themeName, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    snoozeDuration: 15,
    theme: 'system',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await StorageService.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await StorageService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    rightElement 
  }: {
    title: string;
    subtitle?: string;
    icon: string;
    onPress: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />}
    </TouchableOpacity>
  );

  const showSnoozePicker = () => {
    Alert.alert(
      'Snooze Duration',
      'Choose how long to snooze reminders',
      [
        ...SNOOZE_OPTIONS.map(minutes => ({
          text: `${minutes} minutes`,
          onPress: () => updateSettings({ snoozeDuration: minutes }),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const showThemePicker = () => {
    if (Platform.OS === 'web') {
      // For web, cycle through themes on click
      const currentIndex = THEME_OPTIONS.findIndex(t => t.value === themeName);
      const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
      setTheme(THEME_OPTIONS[nextIndex].value);
    } else {
      // For mobile, use a more comprehensive picker
      Alert.alert(
        'Choose Theme',
        `Current: ${getCurrentThemeLabel()}\n\nSelect your preferred theme:`,
        [
          {
            text: 'System Default',
            onPress: () => setTheme('system'),
          },
          {
            text: 'Light Theme',
            onPress: () => setTheme('light'),
          },
          {
            text: 'Dark Theme',
            onPress: () => setTheme('dark'),
          },
          {
            text: 'AMOLED Black',
            onPress: () => setTheme('amoled'),
          },
          { 
            text: 'Cancel', 
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  const getCurrentThemeLabel = () => {
    return THEME_OPTIONS.find(t => t.value === themeName)?.label || 'System Default';
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your VocaliZeit experience</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Settings</Text>
          
          <SettingItem
            title="Snooze Duration"
            subtitle={`${settings.snoozeDuration} minutes`}
            icon="time-outline"
            onPress={showSnoozePicker}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <SettingItem
            title="Theme"
            subtitle={Platform.OS === 'web' ? `${getCurrentThemeLabel()} (tap to cycle)` : getCurrentThemeLabel()}
            icon="color-palette-outline"
            onPress={showThemePicker}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingItem
            title="Test Critical Alert"
            subtitle="Test if notifications work and override silent mode"
            icon="notifications-outline"
            onPress={async () => {
              try {
                const testReminder = {
                  id: 'test-' + Date.now(),
                  task: 'This is a test critical reminder! If you can hear this, your notifications are working properly.',
                  targetTimestamp: Date.now() + 5000, // 5 seconds from now
                  isCritical: true,
                  status: 'upcoming' as const,
                  recurrence: { type: 'none' as const },
                  createdAt: Date.now(),
                };
                
                await NotificationService.testNotification(testReminder);
                
                Alert.alert(
                  'Test Notification Scheduled',
                  'A test critical notification will appear in 5 seconds. Make sure your volume is on and try putting your phone in silent mode to test the override.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('Error testing notification:', error);
                Alert.alert('Error', 'Failed to schedule test notification. Please check your notification permissions.');
              }
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <SettingItem
            title="Version"
            subtitle="1.0.0"
            icon="information-circle-outline"
            onPress={() => {}}
            rightElement={<View />}
          />
          
          <SettingItem
            title="Privacy Policy"
            icon="shield-outline"
            onPress={() => {
              Alert.alert(
                'Privacy Policy',
                'VocaliZeit stores all data locally on your device. No data is sent to external servers.',
                [{ text: 'OK' }]
              );
            }}
          />
          
          <SettingItem
            title="Support"
            icon="help-circle-outline"
            onPress={() => {
              Alert.alert(
                'Support',
                'Need help? Contact us at support@vocalizeit.app',
                [{ text: 'OK' }]
              );
            }}
          />
        </View>
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
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
    marginHorizontal: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
}); 