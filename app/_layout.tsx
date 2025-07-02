import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../src/utils/notifications';
import { ThemeProvider, useTheme } from '../src/utils/theme';

function AppContent() {
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Initialize notifications on app start
    const initializeNotifications = async () => {
      try {
        await NotificationService.registerForPushNotificationsAsync();
      } catch (error) {
        console.warn('Failed to register for push notifications:', error);
      }
    };

    initializeNotifications();

    // Listen for notifications when app is in foreground
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      // TTS is handled automatically by the notification handler
      // Optionally show the alarm screen after a delay to let TTS start
      const reminderId = notification.request.content.data?.reminderId;
      if (reminderId) {
        setTimeout(() => {
          router.push({
            pathname: '/alarm',
            params: { reminderId },
          });
        }, 1000); // 1 second delay to let TTS start
      }
    });

    // Listen for notification interactions (when user taps notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      const reminderId = response.notification.request.content.data?.reminderId;
      if (reminderId) {
        router.push({
          pathname: '/alarm',
          params: { reminderId },
        });
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, [router]);

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            color: theme.colors.text,
          },
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="alarm" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen 
          name="add-reminder" 
          options={{ 
            title: 'Add Reminder', 
            presentation: 'modal',
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.text,
          }} 
        />
        <Stack.Screen 
          name="edit-reminder" 
          options={{ 
            title: 'Edit Reminder', 
            presentation: 'modal',
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.text,
          }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
} 