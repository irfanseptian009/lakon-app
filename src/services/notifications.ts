/**
 * Local, device-side notifications — H-3 / H-1 reminders for milestones and
 * trip departures. No internet, no push service.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let prepared = false;

async function prepare(): Promise<boolean> {
  try {
    if (!prepared && Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Pengingat',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    prepared = true;
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedule H-3 and H-1 09:00 reminders before `dateIso` (YYYY-MM-DD).
 * Returns the scheduled notification ids (skips dates already in the past).
 */
export async function scheduleHMinusReminders(
  title: string,
  dateIso: string,
  labels: { h3: string; h1: string }
): Promise<string[]> {
  const ok = await prepare();
  if (!ok) return [];
  const ids: string[] = [];
  const target = new Date(`${dateIso}T09:00:00`);
  const offsets: [number, string][] = [
    [3, labels.h3],
    [1, labels.h1],
  ];
  for (const [days, body] of offsets) {
    const fireAt = new Date(target);
    fireAt.setDate(fireAt.getDate() - days);
    if (fireAt.getTime() <= Date.now()) continue;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
          channelId: 'reminders',
        },
      });
      ids.push(id);
    } catch {
      // notifications unavailable (e.g. web) — stay silent, app remains usable
    }
  }
  return ids;
}

export async function cancelReminders(ids: string[] | null | undefined) {
  if (!ids) return;
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // already fired or invalid — ignore
    }
  }
}

export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
