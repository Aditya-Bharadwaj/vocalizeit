import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/theme';

interface DeleteToastProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function DeleteToast({ 
  visible, 
  message, 
  onUndo, 
  onDismiss, 
  duration = 3000 
}: DeleteToastProps) {
  const { theme } = useTheme();
  const [progress] = useState(new Animated.Value(1));
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (visible) {
      // Reset the progress bar and timer
      progress.setValue(1);
      setTimeLeft(duration);

      // Start the countdown animation
      Animated.timing(progress, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start();

      // Start the timer
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            clearInterval(timer);
            onDismiss();
            return 0;
          }
          return prev - 100;
        });
      }, 100);

      // Auto-dismiss after duration
      const autoTimer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => {
        clearInterval(timer);
        clearTimeout(autoTimer);
      };
    }
  }, [visible, duration, progress, onDismiss]);

  if (!visible) return null;

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.toast}>
        <View style={styles.content}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.undoButton}
              onPress={onUndo}
            >
              <Text style={styles.undoText}>UNDO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
            >
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View 
          style={[
            styles.progressBar,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]} 
        />
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: theme.name === 'amoled' ? '#000000' : '#374151',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  message: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    marginRight: 16,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  undoText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: theme.colors.primary,
  },
}); 