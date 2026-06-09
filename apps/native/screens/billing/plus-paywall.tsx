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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export function PlusPaywallScreen() {
  const params = useLocalSearchParams<{ reason?: string }>();
  const isPlusActive = useEntitlementsStore((state) => state.isPlusActive);
  const status = useEntitlementsStore((state) => state.status);

  if (isPlusActive) {
    return <ActiveState />;
  }

  if (status === "idle" || status === "configuring") {
    return <LoadingState />;
  }

  return <PaywallContent reason={params.reason} />;
}

function PaywallShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
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
      <CloseButton />
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

function CloseButton() {
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
        onPress={() => router.back()}
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
      <View className="flex-row gap-2">
        <View className="size-12 items-center justify-center rounded-2xl bg-accent-soft">
          <Ionicons name="leaf-outline" size={22} color={accent} />
        </View>
        <View className="size-12 items-center justify-center rounded-2xl bg-accent-soft">
          <Ionicons name="sparkles-outline" size={22} color={accent} />
        </View>
        <View className="size-12 items-center justify-center rounded-2xl bg-accent-soft">
          <Ionicons name="calendar-outline" size={22} color={accent} />
        </View>
      </View>
      <View className="gap-2">
        <Text className="font-display text-4xl text-foreground leading-tight">
          Grow without limits
        </Text>
        <Text className="text-base text-muted leading-6">
          LeafCue is free for up to 20 active plants. Plus unlocks unlimited
          active plants and power tools while your plant data stays on this
          device.
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
  cadence: string;
  isSelected: boolean;
  isBestValue?: boolean;
  savingsLabel?: string | null;
  onPress: () => void;
};

function PlanCard({
  name,
  priceString,
  cadence,
  isSelected,
  isBestValue,
  savingsLabel,
  onPress,
}: PlanCardProps) {
  return (
    <PressableFeedback
      accessibilityLabel={`${name}, ${priceString} ${cadence}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      className={`gap-2 rounded-3xl border bg-surface p-4 ${
        isSelected ? "border-accent" : "border-border/40"
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View
            className={`size-5 items-center justify-center rounded-full border ${
              isSelected ? "border-accent bg-accent" : "border-muted/50"
            }`}
          >
            {isSelected ? (
              <Ionicons name="checkmark" size={12} color="#ffffff" />
            ) : null}
          </View>
          <Text className="font-semibold text-base text-foreground">
            {name}
          </Text>
        </View>
        {isBestValue ? (
          <View className="rounded-full bg-accent px-2.5 py-1">
            <Text className="font-semibold text-[11px] text-accent-foreground">
              Best value
            </Text>
          </View>
        ) : null}
      </View>
      <View className="flex-row items-end justify-between">
        <Text className="font-display-semibold text-foreground text-xl">
          {priceString}
        </Text>
        <Text className="text-muted text-xs">{cadence}</Text>
      </View>
      {savingsLabel ? (
        <Text className="font-medium text-accent text-xs">{savingsLabel}</Text>
      ) : null}
    </PressableFeedback>
  );
}

function PaywallContent({ reason }: { reason?: string }) {
  const annualPackage = useEntitlementsStore((state) => state.annualPackage);
  const monthlyPackage = useEntitlementsStore((state) => state.monthlyPackage);
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
    [annualPackage, monthlyPackage].find(
      (pkg) => pkg?.identifier === selectedPackageIdentifier,
    ) ??
    annualPackage ??
    monthlyPackage ??
    null;

  const savingsPercent = computeAnnualSavingsPercent(
    monthlyPackage,
    annualPackage,
  );

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

  const isAnnualSelected =
    selectedPackage?.identifier === annualPackage?.identifier;
  const ctaLabel = isAnnualSelected
    ? "Continue with Yearly"
    : "Upgrade to Plus";

  const footer = (
    <View className="gap-3">
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
      <View className="flex-row items-center justify-center gap-4">
        <PressableFeedback
          accessibilityLabel="Continue free"
          onPress={() => router.back()}
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
    <PaywallShell footer={footer}>
      <View className="gap-7">
        <HeroHeader />

        {reason === "plant_limit" ? (
          <View className="rounded-3xl border border-border/40 bg-accent-soft p-4">
            <Text className="text-foreground text-sm leading-5">
              You're at the free limit of 20 active plants. Upgrade to keep
              adding new active plants — your existing plants are always
              available.
            </Text>
          </View>
        ) : null}

        <View className="gap-3">
          {BENEFITS.map((benefit) => (
            <BenefitRow key={benefit} label={benefit} />
          ))}
        </View>

        <View className="gap-3">
          {annualPackage ? (
            <PlanCard
              name="Yearly"
              priceString={annualPackage.product.priceString}
              cadence="per year"
              isSelected={isAnnualSelected}
              isBestValue
              savingsLabel={
                savingsPercent !== null ? `Save ${savingsPercent}%` : null
              }
              onPress={() => handleSelect(annualPackage)}
            />
          ) : null}
          {monthlyPackage ? (
            <PlanCard
              name="Monthly"
              priceString={monthlyPackage.product.priceString}
              cadence="per month"
              isSelected={
                selectedPackage?.identifier === monthlyPackage.identifier
              }
              onPress={() => handleSelect(monthlyPackage)}
            />
          ) : null}
        </View>

        <LegalNote />
      </View>
    </PaywallShell>
  );
}

function LegalNote() {
  const muted = useThemeColor("muted");
  return (
    <View className="gap-2">
      <Text className="text-center text-muted text-xs leading-4">
        Subscriptions renew automatically unless canceled. You can manage or
        cancel in your App Store or Google Play account settings.
      </Text>
      <View className="flex-row items-center justify-center gap-3">
        <PressableFeedback
          accessibilityLabel="Terms of Use"
          onPress={() => router.push("/settings/terms")}
        >
          <Text className="text-muted text-xs underline">Terms</Text>
        </PressableFeedback>
        <Text style={{ color: muted }} className="text-xs">
          •
        </Text>
        <PressableFeedback
          accessibilityLabel="Privacy"
          onPress={() => router.push("/settings/privacy")}
        >
          <Text className="text-muted text-xs underline">Privacy</Text>
        </PressableFeedback>
      </View>
    </View>
  );
}

function ActiveState() {
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
      <Button onPress={() => router.back()} accessibilityLabel="Done">
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
    <PaywallShell footer={footer}>
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

function OfflineState() {
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
          onPress={() => router.back()}
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
    <PaywallShell footer={footer}>
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

function LoadingState() {
  return (
    <PaywallShell>
      <View className="flex-1 items-center justify-center py-16">
        <Spinner />
      </View>
    </PaywallShell>
  );
}
