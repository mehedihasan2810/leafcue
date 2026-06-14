import * as Notifications from "expo-notifications";
import { router, useRootNavigationState } from "expo-router";
import { useEffect, useRef } from "react";
import { z } from "zod";

const positiveIntFromNotificationData = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return value;
}, z.number().int().positive());

const notificationRouteDataSchema = z
  .object({
    "leafcue.scheduleId": positiveIntFromNotificationData.optional(),
    plantId: positiveIntFromNotificationData.optional(),
  })
  .passthrough();

function routeFromNotificationResponse(
  response: Notifications.NotificationResponse,
):
  | {
      pathname: "/plants/[plantId]";
      params: { plantId: string };
    }
  | "/tasks"
  | null {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return null;
  }

  const parsed = notificationRouteDataSchema.safeParse(
    response.notification.request.content.data,
  );
  if (!parsed.success) return null;

  if (parsed.data.plantId) {
    return {
      pathname: "/plants/[plantId]",
      params: { plantId: String(parsed.data.plantId) },
    };
  }

  if (parsed.data["leafcue.scheduleId"]) {
    return "/tasks";
  }

  return null;
}

export function NotificationResponseRouter() {
  const rootNavigationState = useRootNavigationState();
  const response = Notifications.useLastNotificationResponse();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (!rootNavigationState?.key || !response) return;

    const responseId = [
      response.notification.request.identifier,
      response.actionIdentifier,
    ].join(":");
    if (handledResponseId.current === responseId) return;

    const route = routeFromNotificationResponse(response);
    if (!route) return;

    handledResponseId.current = responseId;
    router.push(route);
    Notifications.clearLastNotificationResponse();
  }, [response, rootNavigationState?.key]);

  return null;
}
