import * as Notifications from "expo-notifications";

let configured = false;

/**
 * Wire up how notifications are presented when the app is foregrounded. Idempotent.
 * Call once at boot; safe to call repeatedly.
 */
export function configureNotificationHandler(): void {
  if (configured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  configured = true;
}
