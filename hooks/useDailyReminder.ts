import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';

const NOTIFICATION_ID = 'daily-budget-reminder';
const STORAGE_KEY = 'daily_reminder_enabled';

/**
 * Manages a daily local push notification that reminds the user to check
 * their budget. The reminder fires every day at 8 PM local time.
 *
 * - `enabled`       — whether the reminder is currently scheduled.
 * - `toggle`        — enable or disable the reminder; requests permission if needed.
 * - `loading`       — true while reading initial state.
 *
 * Persists the on/off state in expo-notifications' scheduled list, so it
 * survives app restarts without needing AsyncStorage.
 *
 * Example:
 *   const { enabled, toggle, loading } = useDailyReminder();
 */
export function useDailyReminder() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Notifications.getScheduledNotificationsAsync().then((scheduled) => {
      setEnabled(scheduled.some((n) => n.identifier === NOTIFICATION_ID));
      setLoading(false);
    });
  }, []);

  const toggle = useCallback(async () => {
    if (enabled) {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
      setEnabled(false);
      return;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: 'How's your budget today? 💚',
        body: 'Check your daily allowance and log any expenses.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });

    setEnabled(true);
  }, [enabled]);

  return { enabled, toggle, loading };
}
