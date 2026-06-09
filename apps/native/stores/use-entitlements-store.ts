/**
 * Zustand store holding the RevenueCat-backed LeafCue Plus state.
 *
 * RevenueCat remains the source of truth for the `plus` entitlement; this store
 * only mirrors a UI snapshot of the latest CustomerInfo/offerings so screens can
 * render synchronously. There is no persistent local `isPro` flag.
 */
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";
import { create } from "zustand";

import {
  ANNUAL_PACKAGE_ID,
  ANNUAL_PRODUCT_ID,
  MONTHLY_PACKAGE_ID,
  MONTHLY_PRODUCT_ID,
} from "@/lib/billing/constants";
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
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
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

/** Find a package by RevenueCat predefined id, falling back to the product id. */
function findPackage(
  offering: PurchasesOffering | null,
  packageId: string,
  productId: string,
): PurchasesPackage | null {
  if (!offering) return null;
  const byPackageId = offering.availablePackages.find(
    (pkg) => pkg.identifier === packageId,
  );
  if (byPackageId) return byPackageId;
  const byProductId = offering.availablePackages.find(
    (pkg) => pkg.product.identifier === productId,
  );
  return byProductId ?? null;
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
  monthlyPackage: null,
  annualPackage: null,
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
      const annualPackage = findPackage(
        currentOffering,
        ANNUAL_PACKAGE_ID,
        ANNUAL_PRODUCT_ID,
      );
      const monthlyPackage = findPackage(
        currentOffering,
        MONTHLY_PACKAGE_ID,
        MONTHLY_PRODUCT_ID,
      );

      // Prefer annual as the default selection when available.
      const previousSelection = get().selectedPackageIdentifier;
      const selectedPackageIdentifier =
        previousSelection ??
        annualPackage?.identifier ??
        monthlyPackage?.identifier ??
        null;

      set({
        offerings,
        currentOffering,
        annualPackage,
        monthlyPackage,
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
  return state.monthlyPackage !== null || state.annualPackage !== null;
}

/** Derived: is billing reachable enough to present a working paywall? */
export function selectIsBillingAvailable(state: EntitlementsState): boolean {
  return state.status === "ready" && selectHasUsableOffering(state);
}
