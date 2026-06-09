/**
 * Thin, well-typed wrapper around the RevenueCat SDK.
 *
 * Goals:
 * - Configure `Purchases` exactly once, lazily, and only on supported native
 *   platforms (iOS / Android). Web and any other platform are no-ops.
 * - Never throw on a missing API key. A missing key means "billing
 *   unavailable", not "app crash". Core local-first flows must keep working.
 * - Use anonymous RevenueCat users (no custom appUserID) so we never need to
 *   call `logOut()` (which would clear the offline cache).
 * - Only ever read *public* SDK keys, via static `process.env` references so
 *   Expo can inline them at build time.
 */
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
  type MakePurchaseResult,
  type PurchasesError,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";

import { LEAFCUE_PLUS_ENTITLEMENT_ID } from "@/lib/billing/constants";

export type RevenueCatConfigurationStatus =
  | "unsupported-platform"
  | "missing-key"
  | "ready";

const SUPPORTED_PLATFORMS: ReadonlyArray<typeof Platform.OS> = [
  "ios",
  "android",
];

let configured = false;

/**
 * Static env references. Expo only inlines `process.env.EXPO_PUBLIC_*` when it
 * sees the full dotted path literally in source, so do not destructure these.
 */
function readPlatformApiKey(): string | null {
  const shared = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? null;
  const ios = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? null;
  const android = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? null;

  const platformKey =
    Platform.OS === "ios" ? ios : Platform.OS === "android" ? android : null;
  const key = platformKey ?? shared;
  const trimmed = key?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function isSupportedPlatform(): boolean {
  return SUPPORTED_PLATFORMS.includes(Platform.OS);
}

/**
 * Returns whether billing *could* be available, without configuring. Useful for
 * UI that needs to decide between "billing unavailable" and "load plans".
 */
export function getRevenueCatConfigurationStatus(): RevenueCatConfigurationStatus {
  if (!isSupportedPlatform()) return "unsupported-platform";
  if (readPlatformApiKey() === null) return "missing-key";
  return "ready";
}

export function isRevenueCatConfigured(): boolean {
  return configured;
}

/**
 * Configure RevenueCat once. Safe to call repeatedly. Returns true when the SDK
 * is configured and ready for use, false when billing is unavailable.
 */
export function configureRevenueCatIfPossible(): boolean {
  if (configured) return true;
  if (!isSupportedPlatform()) return false;

  const apiKey = readPlatformApiKey();
  if (apiKey === null) return false;

  if (__DEV__) {
    // Verbose logging in development only.
    void Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  // Anonymous user: do not pass appUserID so RevenueCat manages identity and we
  // never need logOut() (which would clear the offline CustomerInfo cache).
  Purchases.configure({ apiKey });
  configured = true;
  return true;
}

export async function getRevenueCatCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.getCustomerInfo();
}

export async function getRevenueCatOfferings(): Promise<PurchasesOfferings | null> {
  if (!configured) return null;
  return Purchases.getOfferings();
}

export async function purchaseRevenueCatPackage(
  pkg: PurchasesPackage,
): Promise<MakePurchaseResult> {
  if (!configured) {
    throw new Error("RevenueCat is not configured");
  }
  return Purchases.purchasePackage(pkg);
}

export async function restoreRevenueCatPurchases(): Promise<CustomerInfo> {
  if (!configured) {
    throw new Error("RevenueCat is not configured");
  }
  return Purchases.restorePurchases();
}

/** True when the `plus` entitlement is currently active in CustomerInfo. */
export function isLeafCuePlusActive(
  customerInfo: CustomerInfo | null,
): boolean {
  if (!customerInfo) return false;
  return (
    customerInfo.entitlements.active[LEAFCUE_PLUS_ENTITLEMENT_ID] !== undefined
  );
}

/**
 * Registers a CustomerInfo update listener and returns an unsubscribe function.
 * No-op (returns a noop unsubscribe) when billing is not configured.
 */
export function addRevenueCatCustomerInfoListener(
  listener: (customerInfo: CustomerInfo) => void,
): () => void {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

/** Narrowing helper: detects a user-cancelled purchase error. */
export function isUserCancelledError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as Partial<PurchasesError>;
  return candidate.userCancelled === true;
}

export type { CustomerInfo, PurchasesOfferings, PurchasesPackage };
