/**
 * Pure decision logic for the free-tier active-plant limit.
 *
 * Kept separate from RevenueCat and from the database so it is trivially
 * testable and reusable across the create-plant and unarchive flows.
 */
import { FREE_ACTIVE_PLANT_LIMIT } from "@/lib/billing/constants";

/**
 * The outcome of evaluating whether the user may add/reactivate one more active
 * plant.
 *
 * - `allow`: under the free limit, or Plus is active. Proceed without friction.
 * - `paywall`: at/over the limit and Plus is inactive but billing is reachable.
 *   Show the Plus paywall.
 * - `offline`: at/over the limit, Plus is not known-active, and billing is
 *   unavailable/offline. Show the calm offline/restore dialog instead of a
 *   broken paywall.
 */
export type PlantLimitDecision = "allow" | "paywall" | "offline";

export type PlantLimitContext = {
  /** Current number of active (non-archived) plants. */
  activeCount: number;
  /** Whether the `plus` entitlement is currently active (incl. cached/offline). */
  isPlusActive: boolean;
  /**
   * Whether RevenueCat billing is reachable enough to present a working
   * paywall. False when the SDK is unavailable, the key is missing, or we are
   * offline with no usable offerings.
   */
  isBillingAvailable: boolean;
};

export function isAtOrAboveFreeLimit(activeCount: number): boolean {
  return activeCount >= FREE_ACTIVE_PLANT_LIMIT;
}

/**
 * Returns how the caller should proceed when the user attempts to create or
 * reactivate an active plant. Never blocks below the free limit, and always
 * allows when Plus is active (including a cached entitlement while offline).
 */
export function evaluatePlantLimit(
  context: PlantLimitContext,
): PlantLimitDecision {
  if (!isAtOrAboveFreeLimit(context.activeCount)) {
    return "allow";
  }
  if (context.isPlusActive) {
    return "allow";
  }
  return context.isBillingAvailable ? "paywall" : "offline";
}
