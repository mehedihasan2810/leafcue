import { router } from "expo-router";

import { PlusPaywallScreen } from "@/screens/billing/plus-paywall";

/**
 * Soft, skippable Plus step at the end of onboarding. Reuses the shared paywall;
 * dismissing (the X or "Maybe later") or finishing a purchase continues to the
 * final onboarding screen rather than navigating back.
 */
export default function OnboardingPlusRoute() {
  return (
    <PlusPaywallScreen
      onClose={() => router.replace("/onboarding/finish")}
      dismissLabel="Maybe later"
    />
  );
}
