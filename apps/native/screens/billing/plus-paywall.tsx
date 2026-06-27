import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  PressableFeedback,
  Spinner,
  useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { PACKAGE_TYPE, PRODUCT_CATEGORY } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FREE_ACTIVE_PLANT_LIMIT } from "@/lib/billing/constants";
import {
  isLeafCuePlusActive,
  type PurchasesPackage,
} from "@/lib/billing/revenuecat";
import {
  selectHasUsableOffering,
  useEntitlementsStore,
} from "@/stores/use-entitlements-store";
import { selectIsLightTheme, useThemeStore } from "@/stores/use-theme-store";

const BENEFITS: ReadonlyArray<string> = [
  "Unlimited active plants",
  "Advanced local insights as they ship",
  "Priority polish and independent development support",
  "Keep all existing data even if you cancel",
];

function lightHaptic() {
  if (Platform.OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

function successHaptic() {
  if (Platform.OS === "ios") {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/**
 * Computes the annual savings versus paying monthly for a year, using numeric
 * product prices. Returns null when the calculation is not reliable so we can
 * omit the badge rather than show a misleading number.
 */
function computeAnnualSavingsPercent(
  monthly: PurchasesPackage | null,
  annual: PurchasesPackage | null,
): number | null {
  if (!monthly || !annual) return null;
  const monthlyPrice = monthly.product.price;
  const annualPrice = annual.product.price;
  if (
    typeof monthlyPrice !== "number" ||
    typeof annualPrice !== "number" ||
    monthlyPrice <= 0 ||
    annualPrice <= 0
  ) {
    return null;
  }
  const yearAtMonthly = monthlyPrice * 12;
  if (annualPrice >= yearAtMonthly) return null;
  const percent = Math.round((1 - annualPrice / yearAtMonthly) * 100);
  return percent > 0 ? percent : null;
}

type PlanBadge = { label: string; tone: "value" | "save" } | null;

type PlanInfo = {
  name: string;
  subtitle: string | null;
  /** Human noun used in the legal line, e.g. "year", "month". Empty for lifetime. */
  cadenceWord: string;
  isLifetime: boolean;
};

type IntroOffer =
  | { kind: "free_trial"; periodLabel: string }
  | { kind: "paid_intro"; priceString: string; periodLabel: string }
  | null;

/** Format an intro/trial period, e.g. (7, "DAY") -> "7-day". */
function formatPeriod(units: number, unit: string): string {
  return `${units}-${unit.toLowerCase()}`;
}

/**
 * Reads any free trial or introductory offer straight off the product. When you
 * add a trial or intro price in App Store Connect / RevenueCat, it surfaces here
 * automatically — no code change required.
 */
function describeIntroOffer(product: PurchasesPackage["product"]): IntroOffer {
  const intro = product.introPrice;
  if (!intro || intro.periodNumberOfUnits <= 0) return null;
  const label = formatPeriod(intro.periodNumberOfUnits, intro.periodUnit);
  if (intro.price <= 0) return { kind: "free_trial", periodLabel: label };
  return {
    kind: "paid_intro",
    priceString: intro.priceString,
    periodLabel: label,
  };
}

/** Derive display copy for a package from its type — never from hardcoded ids. */
function describePlan(pkg: PurchasesPackage): PlanInfo {
  const product = pkg.product;
  const isLifetime =
    pkg.packageType === PACKAGE_TYPE.LIFETIME ||
    product.productCategory === PRODUCT_CATEGORY.NON_SUBSCRIPTION;
  if (isLifetime) {
    return {
      name: "Lifetime",
      subtitle: "Pay once · yours forever",
      cadenceWord: "",
      isLifetime: true,
    };
  }
  switch (pkg.packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return {
        name: "Annual",
        subtitle: product.pricePerMonthString
          ? `≈ ${product.pricePerMonthString} / mo, billed yearly`
          : "Billed yearly",
        cadenceWord: "year",
        isLifetime: false,
      };
    case PACKAGE_TYPE.SIX_MONTH:
      return {
        name: "6 Months",
        subtitle: "Billed every 6 months",
        cadenceWord: "6 months",
        isLifetime: false,
      };
    case PACKAGE_TYPE.THREE_MONTH:
      return {
        name: "3 Months",
        subtitle: "Billed quarterly",
        cadenceWord: "3 months",
        isLifetime: false,
      };
    case PACKAGE_TYPE.TWO_MONTH:
      return {
        name: "2 Months",
        subtitle: "Billed every 2 months",
        cadenceWord: "2 months",
        isLifetime: false,
      };
    case PACKAGE_TYPE.WEEKLY:
      return {
        name: "Weekly",
        subtitle: "Billed weekly",
        cadenceWord: "week",
        isLifetime: false,
      };
    default:
      return {
        name: "Monthly",
        subtitle: "Billed monthly",
        cadenceWord: "month",
        isLifetime: false,
      };
  }
}

/** Which badge, if any, a card should float above it. */
function badgeForPackage(
  pkg: PurchasesPackage,
  info: PlanInfo,
  savingsPercent: number | null,
): PlanBadge {
  if (info.isLifetime) return { label: "Best value", tone: "value" };
  if (pkg.packageType === PACKAGE_TYPE.ANNUAL && savingsPercent !== null) {
    return { label: `Save ${savingsPercent}%`, tone: "save" };
  }
  return null;
}

/** Build the fine-print line for the selected plan, including any trial/intro. */
function buildLegalLine(
  pkg: PurchasesPackage,
  info: PlanInfo,
  intro: IntroOffer,
): string {
  const price = pkg.product.priceString;
  if (info.isLifetime) {
    return `${price} one-time purchase. No subscription — nothing to renew.`;
  }
  const per = info.cadenceWord ? ` per ${info.cadenceWord}` : "";
  const renew =
    "Auto-renews until cancelled — cancel anytime in your store account settings.";
  if (intro?.kind === "free_trial") {
    return `${intro.periodLabel} free, then ${price}${per}. ${renew}`;
  }
  if (intro?.kind === "paid_intro") {
    return `${intro.priceString} for your first ${intro.periodLabel}, then ${price}${per}. ${renew}`;
  }
  return `${price}${per}. ${renew}`;
}

type PlusPaywallScreenProps = {
  /** What dismissing the paywall does. Defaults to navigating back. */
  onClose?: () => void;
  /**
   * When set, renders an extra "skip" affordance (e.g. "Maybe later") below the
   * fine print. Used by the onboarding step; omitted in Settings (the X closes).
   */
  dismissLabel?: string;
};

export function PlusPaywallScreen({
  onClose,
  dismissLabel,
}: PlusPaywallScreenProps = {}) {
  const params = useLocalSearchParams<{ reason?: string }>();
  const isPlusActive = useEntitlementsStore((state) => state.isPlusActive);
  const status = useEntitlementsStore((state) => state.status);

  const close = onClose ?? (() => router.back());

  if (isPlusActive) {
    return <ActiveState onClose={close} />;
  }

  if (status === "idle" || status === "configuring") {
    return <LoadingState onClose={close} />;
  }

  return (
    <PaywallContent
      reason={params.reason}
      onClose={close}
      dismissLabel={dismissLabel}
    />
  );
}

function PaywallShell({
  children,
  footer,
  onClose,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isLight = useThemeStore(selectIsLightTheme);
  const [accentSoft, surface, background] = useThemeColor([
    "accent-soft",
    "surface",
    "background",
  ]);
  const gradientColors: readonly [string, string, string] = isLight
    ? [accentSoft, surface, background]
    : [background, surface, accentSoft];

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
        pointerEvents="none"
      />
      <CloseButton onClose={onClose} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 56,
          paddingHorizontal: 20,
          paddingBottom: footer ? 16 : insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View
          className="border-border/40 border-t bg-background/95 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

function CloseButton({ onClose }: { onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const muted = useThemeColor("muted");
  return (
    <View
      className="absolute right-5 z-10"
      style={{ top: insets.top + 8 }}
      pointerEvents="box-none"
    >
      <PressableFeedback
        accessibilityLabel="Close"
        onPress={onClose ?? (() => router.back())}
        className="size-9 items-center justify-center rounded-full bg-surface"
      >
        <Ionicons name="close" size={20} color={muted} />
      </PressableFeedback>
    </View>
  );
}

function HeroHeader() {
  const accent = useThemeColor("accent");
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="font-display text-4xl text-foreground leading-tight">
          Grow without limits
        </Text>
        <Text className="text-base text-muted leading-6">
          LeafCue is free for up to {FREE_ACTIVE_PLANT_LIMIT} active plants.
          Plus unlocks unlimited active plants and power tools while your plant
          data stays on this device.
        </Text>
      </View>
      <View className="flex-row items-center gap-2 self-start rounded-full bg-accent-soft px-3 py-1.5">
        <Ionicons name="lock-closed-outline" size={13} color={accent} />
        <Text className="font-medium text-accent text-xs">
          No ads. No account. Your plant data stays local.
        </Text>
      </View>
    </View>
  );
}

function BenefitRow({ label }: { label: string }) {
  const accent = useThemeColor("accent");
  return (
    <View className="flex-row items-center gap-3">
      <View className="size-6 items-center justify-center rounded-full bg-accent-soft">
        <Ionicons name="checkmark" size={15} color={accent} />
      </View>
      <Text className="flex-1 text-foreground text-sm">{label}</Text>
    </View>
  );
}

type PlanCardProps = {
  name: string;
  priceString: string;
  subtitle: string | null;
  isSelected: boolean;
  badge: PlanBadge;
  onPress: () => void;
};

/** A square plan tile sized to sit three-across in the sticky footer. */
function PlanCard({
  name,
  priceString,
  subtitle,
  isSelected,
  badge,
  onPress,
}: PlanCardProps) {
  return (
    <View className="flex-1">
      {badge ? (
        <View
          className="absolute -top-2 right-0 left-0 z-10 items-center"
          pointerEvents="none"
        >
          <View
            className={`rounded-full px-2 py-0.5 ${
              badge.tone === "value" ? "bg-accent" : "bg-background border border-accent"
            }`}
          >
            <Text
              className={`font-semibold text-[10px] ${
                badge.tone === "value"
                  ? "text-accent-foreground"
                  : "text-accent"
              }`}
              numberOfLines={1}
            >
              {badge.label}
            </Text>
          </View>
        </View>
      ) : null}
      <PressableFeedback
        accessibilityLabel={`${name}, ${priceString}${subtitle ? `, ${subtitle}` : ""}`}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        onPress={onPress}
        className={`min-h-[112px] items-center justify-center gap-1 rounded-2xl border px-2 pt-4 pb-3 ${
          isSelected
            ? "border-accent bg-accent-soft"
            : "border-border/40 bg-surface"
        }`}
      >
        <Text
          className="font-semibold text-foreground text-sm"
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          className="font-display-semibold text-foreground text-lg"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {priceString}
        </Text>
        {subtitle ? (
          <Text
            className="text-center text-[10px] text-muted leading-tight"
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </PressableFeedback>
    </View>
  );
}

/** Calm "you can stay free" reassurance shown in the scrollable area. */
function ReassuranceNote() {
  const muted = useThemeColor("muted");
  return (
    <View className="flex-row items-start gap-3 rounded-2xl bg-surface/60 p-4">
      <Ionicons
        name="lock-closed-outline"
        size={16}
        color={muted}
        style={{ marginTop: 1 }}
      />
      <Text className="flex-1 text-muted text-sm leading-5">
        Not ready? LeafCue's core stays free forever — your records and exports
        are always yours, right here on this device.
      </Text>
    </View>
  );
}

function PaywallContent({
  reason,
  onClose,
  dismissLabel,
}: {
  reason?: string;
  onClose?: () => void;
  dismissLabel?: string;
}) {
  const availablePackages = useEntitlementsStore(
    (state) => state.availablePackages,
  );
  const selectedPackageIdentifier = useEntitlementsStore(
    (state) => state.selectedPackageIdentifier,
  );
  const selectPackage = useEntitlementsStore((state) => state.selectPackage);
  const purchasePackage = useEntitlementsStore(
    (state) => state.purchasePackage,
  );
  const restorePurchases = useEntitlementsStore(
    (state) => state.restorePurchases,
  );
  const hasUsableOffering = useEntitlementsStore(selectHasUsableOffering);

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const accentForeground = useThemeColor("accent-foreground");

  if (!hasUsableOffering) {
    return <OfflineState />;
  }

  const selectedPackage =
    availablePackages.find(
      (pkg) => pkg.identifier === selectedPackageIdentifier,
    ) ??
    availablePackages[0] ??
    null;

  // Monthly + annual are only needed to compute the annual savings badge.
  const monthlyPackage =
    availablePackages.find((pkg) => pkg.packageType === PACKAGE_TYPE.MONTHLY) ??
    null;
  const annualPackage =
    availablePackages.find((pkg) => pkg.packageType === PACKAGE_TYPE.ANNUAL) ??
    null;
  const savingsPercent = computeAnnualSavingsPercent(
    monthlyPackage,
    annualPackage,
  );

  const selectedInfo = selectedPackage ? describePlan(selectedPackage) : null;
  const selectedIntro = selectedPackage
    ? describeIntroOffer(selectedPackage.product)
    : null;

  const handleSelect = (pkg: PurchasesPackage) => {
    lightHaptic();
    selectPackage(pkg.identifier);
  };

  const handlePurchase = async () => {
    if (!selectedPackage || isPurchasing) return;
    setIsPurchasing(true);
    try {
      const customerInfo = await purchasePackage(selectedPackage);
      if (customerInfo) {
        successHaptic();
      }
      // On success the store flips isPlusActive and the screen re-renders to
      // the active state; user-cancelled returns null and we stay put.
    } catch (error) {
      Alert.alert(
        "Purchase failed",
        error instanceof Error
          ? error.message
          : "Something went wrong completing your purchase.",
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      const restoredPlus = isLeafCuePlusActive(customerInfo);
      if (!restoredPlus) {
        Alert.alert(
          "Nothing to restore",
          "We couldn't find an active LeafCue Plus subscription on this account.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Restore failed",
        error instanceof Error
          ? error.message
          : "Something went wrong restoring your purchases.",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const ctaLabel = !selectedPackage
    ? "Continue"
    : selectedIntro?.kind === "free_trial"
      ? `Start ${selectedIntro.periodLabel} free trial`
      : `Continue — ${selectedPackage.product.priceString}`;

  const cancelLine =
    selectedIntro?.kind === "free_trial"
      ? "No charge today · cancel anytime before your trial ends."
      : "Cancel anytime.";
  const legalLine =
    selectedPackage && selectedInfo
      ? buildLegalLine(selectedPackage, selectedInfo, selectedIntro)
      : "";

  const footer = (
    <View className="gap-3">
      <View className="flex-row gap-2 pt-2">
        {availablePackages.map((pkg) => {
          const info = describePlan(pkg);
          return (
            <PlanCard
              key={pkg.identifier}
              name={info.name}
              priceString={pkg.product.priceString}
              subtitle={info.subtitle}
              isSelected={pkg.identifier === selectedPackage?.identifier}
              badge={badgeForPackage(pkg, info, savingsPercent)}
              onPress={() => handleSelect(pkg)}
            />
          );
        })}
      </View>

      <Button
        isDisabled={!selectedPackage || isPurchasing}
        onPress={handlePurchase}
        accessibilityLabel={ctaLabel}
      >
        {isPurchasing ? (
          <Spinner color={accentForeground} />
        ) : (
          <Button.Label>{ctaLabel}</Button.Label>
        )}
      </Button>

      <View className="gap-1.5">
        <Text className="text-center text-muted text-xs">{cancelLine}</Text>
        <Text className="text-center text-[11px] text-muted/80 leading-4">
          {legalLine}
        </Text>
        <View className="flex-row items-center justify-center gap-4 pt-0.5">
          <PressableFeedback
            accessibilityLabel="Restore purchases"
            onPress={handleRestore}
          >
            <Text className="font-medium text-accent text-xs">
              {isRestoring ? "Restoring…" : "Restore"}
            </Text>
          </PressableFeedback>
          <PressableFeedback
            accessibilityLabel="Terms of Use"
            onPress={() => router.push("/settings/terms")}
          >
            <Text className="text-muted text-xs">Terms</Text>
          </PressableFeedback>
          <PressableFeedback
            accessibilityLabel="Privacy"
            onPress={() => router.push("/settings/privacy")}
          >
            <Text className="text-muted text-xs">Privacy</Text>
          </PressableFeedback>
        </View>
      </View>
      {dismissLabel ? (
        <PressableFeedback
          accessibilityLabel={dismissLabel}
          onPress={onClose}
          className="items-center"
        >
          <Text className="font-semibold text-muted text-sm">
            {dismissLabel}
          </Text>
        </PressableFeedback>
      ) : null}
    </View>
  );

  return (
    <PaywallShell footer={footer} onClose={onClose}>
      <View className="gap-7">
        <HeroHeader />

        {reason === "plant_limit" ? (
          <View className="rounded-3xl border border-border/40 bg-accent-soft p-4">
            <Text className="text-foreground text-sm leading-5">
              You're at the free limit of {FREE_ACTIVE_PLANT_LIMIT} active
              plants. Upgrade to keep adding new active plants — your existing
              plants are always available.
            </Text>
          </View>
        ) : null}

        <View className="gap-3">
          {BENEFITS.map((benefit) => (
            <BenefitRow key={benefit} label={benefit} />
          ))}
        </View>

        <ReassuranceNote />
      </View>
    </PaywallShell>
  );
}

function ActiveState({ onClose }: { onClose?: () => void }) {
  const accent = useThemeColor("accent");
  const restorePurchases = useEntitlementsStore(
    (state) => state.restorePurchases,
  );
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      await restorePurchases();
    } catch {
      // Restore on an already-active account is harmless; ignore failures here.
    } finally {
      setIsRestoring(false);
    }
  };

  const footer = (
    <View className="gap-3">
      <Button
        onPress={onClose ?? (() => router.back())}
        accessibilityLabel="Done"
      >
        <Button.Label>Done</Button.Label>
      </Button>
      <PressableFeedback
        accessibilityLabel="Restore purchases"
        onPress={handleRestore}
        className="items-center"
      >
        <Text className="font-medium text-accent text-sm">
          {isRestoring ? "Restoring…" : "Restore purchases"}
        </Text>
      </PressableFeedback>
    </View>
  );

  return (
    <PaywallShell footer={footer} onClose={onClose}>
      <View className="flex-1 items-center justify-center gap-5 py-12">
        <View className="size-20 items-center justify-center rounded-full bg-accent-soft">
          <Ionicons name="sparkles" size={36} color={accent} />
        </View>
        <View className="gap-2">
          <Text className="text-center font-display text-3xl text-foreground">
            You're on LeafCue Plus
          </Text>
          <Text className="text-center text-base text-muted leading-6">
            Unlimited active plants are unlocked. Thank you for supporting a
            private, offline-first plant care app.
          </Text>
        </View>
      </View>
    </PaywallShell>
  );
}

function OfflineState({ onClose }: { onClose?: () => void }) {
  const accent = useThemeColor("accent");
  const configure = useEntitlementsStore((state) => state.configure);
  const refreshOfferings = useEntitlementsStore(
    (state) => state.refreshOfferings,
  );
  const refreshCustomerInfo = useEntitlementsStore(
    (state) => state.refreshCustomerInfo,
  );
  const restorePurchases = useEntitlementsStore(
    (state) => state.restorePurchases,
  );
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await configure();
      await refreshCustomerInfo();
      await refreshOfferings();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      await restorePurchases();
    } catch (error) {
      Alert.alert(
        "Restore failed",
        error instanceof Error
          ? error.message
          : "Connect to the internet and try again.",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const footer = (
    <View className="gap-3">
      <Button onPress={handleRetry} accessibilityLabel="Try again">
        {isRetrying ? <Spinner /> : <Button.Label>Try again</Button.Label>}
      </Button>
      <View className="flex-row items-center justify-center gap-4">
        <PressableFeedback
          accessibilityLabel="Continue free"
          onPress={onClose ?? (() => router.back())}
        >
          <Text className="font-medium text-muted text-sm">Continue free</Text>
        </PressableFeedback>
        <Text className="text-muted/40">•</Text>
        <PressableFeedback
          accessibilityLabel="Restore purchases"
          onPress={handleRestore}
        >
          <Text className="font-medium text-accent text-sm">
            {isRestoring ? "Restoring…" : "Restore purchases"}
          </Text>
        </PressableFeedback>
      </View>
    </View>
  );

  return (
    <PaywallShell footer={footer} onClose={onClose}>
      <View className="flex-1 items-center justify-center gap-5 py-12">
        <View className="size-20 items-center justify-center rounded-full bg-accent-soft">
          <Ionicons name="cloud-offline-outline" size={34} color={accent} />
        </View>
        <View className="gap-2">
          <Text className="text-center font-display text-2xl text-foreground">
            Couldn't load LeafCue Plus plans
          </Text>
          <Text className="text-center text-base text-muted leading-6">
            Connect to the internet to load plans, upgrade, or restore
            purchases. Your existing plant data still works offline.
          </Text>
        </View>
      </View>
    </PaywallShell>
  );
}

function LoadingState({ onClose }: { onClose?: () => void }) {
  return (
    <PaywallShell onClose={onClose}>
      <View className="flex-1 items-center justify-center py-16">
        <Spinner />
      </View>
    </PaywallShell>
  );
}
