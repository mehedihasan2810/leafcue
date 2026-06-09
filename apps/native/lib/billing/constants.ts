/**
 * LeafCue Plus billing constants.
 *
 * RevenueCat is the source of truth for Plus. These identifiers mirror the
 * dashboard configuration (entitlement, offering, packages, products). Prices
 * are never hardcoded — they always come from RevenueCat store products.
 */

/** RevenueCat entitlement identifier that unlocks LeafCue Plus. */
export const LEAFCUE_PLUS_ENTITLEMENT_ID = "plus";

/** Free tier ceiling for *active* (non-archived) plants. */
export const FREE_ACTIVE_PLANT_LIMIT = 20;

/** Predefined RevenueCat package identifiers within the current offering. */
export const MONTHLY_PACKAGE_ID = "$rc_monthly";
export const ANNUAL_PACKAGE_ID = "$rc_annual";

/** Store product identifiers (used only as fallback sorting/selection hints). */
export const MONTHLY_PRODUCT_ID = "leafcue_monthly";
export const ANNUAL_PRODUCT_ID = "leafcue_yearly";

/** Reasons the paywall can be opened, surfaced via the `reason` route param. */
export type PaywallReason = "plant_limit" | "settings" | "unarchive";
