import { router } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";

import {
  FREE_ACTIVE_PLANT_LIMIT,
  type PaywallReason,
} from "@/lib/billing/constants";
import {
  evaluatePlantLimit,
  isAtOrAboveFreeLimit,
} from "@/lib/billing/plant-limit";
import { useDatabase } from "@/lib/db";
import { countActivePlants } from "@/lib/db/repositories";
import {
  selectIsBillingAvailable,
  useEntitlementsStore,
} from "@/stores/use-entitlements-store";

const OFFLINE_DIALOG_TITLE = `You've reached the free limit of ${FREE_ACTIVE_PLANT_LIMIT} active plants.`;
const OFFLINE_DIALOG_MESSAGE =
  "Connect to the internet to check LeafCue Plus, restore purchases, or upgrade.\nYour existing plant data is still available offline.";

type RequestActivePlantSlotOptions = {
  /** Called when the user is allowed to create/reactivate an active plant. */
  onAllow: () => void;
  /** Reason passed to the paywall route for contextual copy. */
  reason?: PaywallReason;
};

/**
 * Gate for creating or reactivating an *active* plant.
 *
 * - Below the free limit: allows immediately without touching RevenueCat.
 * - At/over the limit: refreshes CustomerInfo, then either allows (Plus, incl.
 *   cached/offline), opens the Plus paywall, or shows a calm offline/restore
 *   dialog when billing is unreachable.
 */
export function usePlantLimitGate() {
  const db = useDatabase();

  const requestActivePlantSlot = useCallback(
    async ({
      onAllow,
      reason = "plant_limit",
    }: RequestActivePlantSlotOptions) => {
      const activeCount = countActivePlants(db);

      // Fast path: never call RevenueCat below the free limit.
      if (!isAtOrAboveFreeLimit(activeCount)) {
        onAllow();
        return;
      }

      const store = useEntitlementsStore.getState();

      // Pull the freshest entitlement (RevenueCat returns cached info offline).
      await store.refreshCustomerInfo();
      // Try to (re)load offerings so the paywall can render real plans.
      if (!selectIsBillingAvailable(useEntitlementsStore.getState())) {
        await store.refreshOfferings();
      }

      const latest = useEntitlementsStore.getState();
      const decision = evaluatePlantLimit({
        activeCount,
        isPlusActive: latest.isPlusActive,
        isBillingAvailable: selectIsBillingAvailable(latest),
      });

      if (decision === "allow") {
        onAllow();
        return;
      }

      if (decision === "paywall") {
        openPaywall(reason);
        return;
      }

      // Offline / billing unavailable: calm dialog, not a broken paywall.
      Alert.alert(OFFLINE_DIALOG_TITLE, OFFLINE_DIALOG_MESSAGE, [
        { text: "Continue free", style: "cancel" },
        { text: "Open LeafCue Plus", onPress: () => openPaywall(reason) },
      ]);
    },
    [db],
  );

  return { requestActivePlantSlot };
}

function openPaywall(reason: PaywallReason) {
  router.push({
    pathname: "/settings/plus",
    params: { reason },
  });
}
