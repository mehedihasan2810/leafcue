import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type NotificationPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined";

export async function getPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

export async function requestPermissionIfNeeded(): Promise<NotificationPermissionStatus> {
  const current = await getPermissionStatus();
  if (current === "granted") return "granted";
  const response = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: false,
    },
  });
  if (response.status === "granted") return "granted";
  if (response.status === "denied") return "denied";
  return "undetermined";
}

const ANDROID_CHANNEL_ID = "leafcue-care-reminders";

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Care reminders",
    description: "Plant care reminders scheduled on this device.",
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: false,
    sound: null,
    enableLights: true,
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#1f9d55",
  });
}

export const careReminderChannelId = ANDROID_CHANNEL_ID;
