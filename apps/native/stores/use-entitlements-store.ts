/**
 * Zustand store holding the RevenueCat-backed LeafCue Plus state.
 *
 * RevenueCat remains the source of truth for the `plus` entitlement; this store
 * only mirrors a UI snapshot of the latest CustomerInfo/offerings so screens can
 * render synchronously. There is no persistent local `isPro` flag.
 */
import {
  type CustomerInfo,
  PACKAGE_TYPE,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";
import { create } from "zustand";

import {
  configureRevenueCatIfPossible,
  getRevenueCatConfigurationStatus,
  getRevenueCatCustomerInfo,
  getRevenueCatOfferings,
  isLeafCuePlusActive,
  isUserCancelledError,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from "@/lib/billing/revenuecat";

export type BillingStatus =
  | "idle"
  | "unavailable"
  | "configuring"
  | "ready"
  | "error";

type EntitlementsState = {
  status: BillingStatus;
  isPlusActive: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  currentOffering: PurchasesOffering | null;
  /**
   * Every package in the current offering, in display order. The paywall
   * renders whatever is here — durations, intro offers, and free trials all
   * flow straight from RevenueCat without code changes.
   */
  availablePackages: PurchasesPackage[];
  selectedPackageIdentifier: string | null;
  customerInfoCheckedAt: number | null;
  offeringsCheckedAt: number | null;
  lastErrorMessage: string | null;
  configure: () => Promise<void>;
  refreshCustomerInfo: () => Promise<CustomerInfo | null>;
  refreshOfferings: () => Promise<PurchasesOfferings | null>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  selectPackage: (identifier: string) => void;
  applyCustomerInfo: (customerInfo: CustomerInfo) => void;
};

/** Display rank: lifetime and longer commitments first, weekly last. */
const PACKAGE_SORT_RANK: Record<PACKAGE_TYPE, number> = {
  [PACKAGE_TYPE.LIFETIME]: 0,
  [PACKAGE_TYPE.ANNUAL]: 1,
  [PACKAGE_TYPE.SIX_MONTH]: 2,
  [PACKAGE_TYPE.THREE_MONTH]: 3,
  [PACKAGE_TYPE.TWO_MONTH]: 4,
  [PACKAGE_TYPE.MONTHLY]: 5,
  [PACKAGE_TYPE.WEEKLY]: 6,
  [PACKAGE_TYPE.CUSTOM]: 7,
  [PACKAGE_TYPE.UNKNOWN]: 8,
};

/**
 * Order packages for display. Whatever durations the offering contains render
 * in this order, so adding or removing a plan in RevenueCat needs no code
 * change.
 */
function sortPackages(
  packages: readonly PurchasesPackage[],
): PurchasesPackage[] {
  return [...packages].sort(
    (a, b) =>
      PACKAGE_SORT_RANK[a.packageType] - PACKAGE_SORT_RANK[b.packageType],
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export const useEntitlementsStore = create<EntitlementsState>()((set, get) => ({
  status: "idle",
  isPlusActive: false,
  customerInfo: null,
  offerings: null,
  currentOffering: null,
  availablePackages: [],
  selectedPackageIdentifier: null,
  customerInfoCheckedAt: null,
  offeringsCheckedAt: null,
  lastErrorMessage: null,

  applyCustomerInfo: (customerInfo) => {
    set({
      customerInfo,
      isPlusActive: isLeafCuePlusActive(customerInfo),
      customerInfoCheckedAt: Date.now(),
    });
  },

  configure: async () => {
    const { status } = get();
    if (status === "configuring" || status === "ready") return;

    if (getRevenueCatConfigurationStatus() !== "ready") {
      set({ status: "unavailable" });
      return;
    }

    set({ status: "configuring", lastErrorMessage: null });

    const configured = configureRevenueCatIfPossible();
    if (!configured) {
      set({ status: "unavailable" });
      return;
    }

    set({ status: "ready" });

    // Fetch entitlement + offerings without blocking the caller on failures.
    await get().refreshCustomerInfo();
    await get().refreshOfferings();
  },

  refreshCustomerInfo: async () => {
    try {
      const customerInfo = await getRevenueCatCustomerInfo();
      if (!customerInfo) return null;
      get().applyCustomerInfo(customerInfo);
      return customerInfo;
    } catch (error) {
      set({ lastErrorMessage: errorMessage(error) });
      return null;
    }
  },

  refreshOfferings: async () => {
    try {
      const offerings = await getRevenueCatOfferings();
      if (!offerings) return null;

      const currentOffering = offerings.current;
      const availablePackages = sortPackages(
        currentOffering?.availablePackages ?? [],
      );

      // Keep the user's prior choice if it still exists; otherwise default to
      // the annual plan, then fall back to the first available package.
      const previousSelection = get().selectedPackageIdentifier;
      const previousStillAvailable =
        previousSelection != null &&
        availablePackages.some((pkg) => pkg.identifier === previousSelection);
      const annualPackage = availablePackages.find(
        (pkg) => pkg.packageType === PACKAGE_TYPE.ANNUAL,
      );
      const selectedPackageIdentifier = previousStillAvailable
        ? previousSelection
        : (annualPackage?.identifier ??
          availablePackages[0]?.identifier ??
          null);

      set({
        offerings,
        currentOffering,
        availablePackages,
        selectedPackageIdentifier,
        offeringsCheckedAt: Date.now(),
      });
      return offerings;
    } catch (error) {
      set({
        lastErrorMessage: errorMessage(error),
        offeringsCheckedAt: Date.now(),
      });
      return null;
    }
  },

  purchasePackage: async (pkg) => {
    try {
      const result = await purchaseRevenueCatPackage(pkg);
      get().applyCustomerInfo(result.customerInfo);
      return result.customerInfo;
    } catch (error) {
      // User cancellation is an expected, non-error outcome.
      if (isUserCancelledError(error)) {
        return null;
      }
      set({ lastErrorMessage: errorMessage(error) });
      throw error;
    }
  },

  restorePurchases: async () => {
    try {
      const customerInfo = await restoreRevenueCatPurchases();
      get().applyCustomerInfo(customerInfo);
      return customerInfo;
    } catch (error) {
      set({ lastErrorMessage: errorMessage(error) });
      throw error;
    }
  },

  selectPackage: (identifier) => {
    set({ selectedPackageIdentifier: identifier });
  },
}));

/** Derived: do we have a usable offering with at least one package to show? */
export function selectHasUsableOffering(state: EntitlementsState): boolean {
  return state.availablePackages.length > 0;
}

/** Derived: is billing reachable enough to present a working paywall? */
export function selectIsBillingAvailable(state: EntitlementsState): boolean {
  return state.status === "ready" && selectHasUsableOffering(state);
}
