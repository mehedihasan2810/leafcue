import { useEffect } from "react";

import { addRevenueCatCustomerInfoListener } from "@/lib/billing/revenuecat";
import { useEntitlementsStore } from "@/stores/use-entitlements-store";

/**
 * Mounts once near the root provider tree to configure RevenueCat and keep the
 * entitlements store in sync. Intentionally renders nothing and never blocks app
 * startup — when billing is unavailable (no key / unsupported platform) this is
 * a quiet no-op.
 */
export function BillingBootstrapper() {
  const configure = useEntitlementsStore((state) => state.configure);
  const applyCustomerInfo = useEntitlementsStore(
    (state) => state.applyCustomerInfo,
  );
  const status = useEntitlementsStore((state) => state.status);

  useEffect(() => {
    void configure();
  }, [configure]);

  // Register the CustomerInfo listener only once RevenueCat is configured, so
  // updates from purchases/restores on any surface flow back into the store.
  useEffect(() => {
    if (status !== "ready") return;
    const unsubscribe = addRevenueCatCustomerInfoListener((customerInfo) => {
      applyCustomerInfo(customerInfo);
    });
    return () => {
      unsubscribe();
    };
  }, [status, applyCustomerInfo]);

  return null;
}
