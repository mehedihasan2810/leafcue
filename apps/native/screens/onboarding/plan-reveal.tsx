import { Ionicons } from "@expo/vector-icons";
import { addDays, format } from "date-fns";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";

import {
  type CareEnvironment,
  computeFertilizeInterval,
  computeWateringInterval,
  resolveBaseInterval,
} from "@/lib/care/engine";
import { useDatabase } from "@/lib/db";
import {
  createPlantWithDefaults,
  getCareTaskTemplates,
  getPresetById,
  getSetting,
} from "@/lib/db/repositories";
import type { LightPreference } from "@/lib/db/schema";
import {
  appPreferencesKey,
  appPreferencesSchema,
  type OnboardingExperience,
  type OnboardingLight,
} from "@/lib/db/zod";
import { OnboardingShell } from "@/screens/onboarding/_components/onboarding-shell";
import type { CareStyle } from "@/screens/plants/edit/care-style";
import {
  applyPlantPresetHints,
  buildPlantIntakeInput,
  buildPlantIntakeValues,
} from "@/screens/plants/edit/plant-intake";
import { useOnboardingStore } from "@/stores/use-onboarding-store";

const LIGHT_MAP: Record<OnboardingLight, LightPreference> = {
  low: "low",
  medium: "medium",
  bright: "bright-indirect",
};

function careStyleForExperience(
  experience: OnboardingExperience | null,
): CareStyle {
  return experience === "expert" ? "growth" : "balanced";
}

export function OnboardingPlanRevealScreen() {
  const db = useDatabase();
  const draftPlant = useOnboardingStore((state) => state.draftPlant);
  const profile = useOnboardingStore((state) => state.profile);
  const setProfile = useOnboardingStore((state) => state.setProfile);
  const setDraftPlant = useOnboardingStore((state) => state.setDraftPlant);
  const [submitting, setSubmitting] = useState(false);
  const createdRef = useRef(false);

  const plan = useMemo(() => {
    if (!draftPlant) return null;
    const preset =
      draftPlant.presetId != null
        ? (getPresetById(db, draftPlant.presetId) ?? null)
        : null;

    let values = buildPlantIntakeValues();
    if (preset) values = applyPlantPresetHints(values, preset);
    values = {
      ...values,
      nickname: draftPlant.nickname,
      speciesPresetId: preset?.id ?? null,
      careStyle: careStyleForExperience(profile.experience),
    };
    if (profile.homeLight) {
      values.lightPreference = LIGHT_MAP[profile.homeLight];
    }

    const templates = getCareTaskTemplates(db);
    const waterTemplate = templates.find((t) => t.key === "water") ?? null;
    const fertTemplate = templates.find((t) => t.key === "fertilize") ?? null;
    const hemisphere =
      getSetting(db, appPreferencesKey, appPreferencesSchema)?.hemisphere ??
      "north";

    const env: CareEnvironment = {
      lightPreference: values.lightPreference,
      wateringPreference: values.wateringPreference,
      potSize: null,
      hasDrainage: true,
      directSunHours: null,
      careStyle: values.careStyle,
      now: new Date(),
      hemisphere,
    };

    const waterBase =
      resolveBaseInterval(
        waterTemplate?.defaultIntervalDays ?? 7,
        preset?.water ?? null,
      ) ?? 7;
    const fertBase =
      resolveBaseInterval(
        fertTemplate?.defaultIntervalDays ?? 30,
        preset?.fertilizer ?? null,
      ) ?? 30;

    return {
      nickname: draftPlant.nickname,
      preset,
      values,
      water: computeWateringInterval(waterBase, env),
      fert: computeFertilizeInterval(fertBase, env),
    };
  }, [db, draftPlant, profile]);

  // If we land here without a draft (and haven't just created one), bounce out.
  useEffect(() => {
    if (!draftPlant && !createdRef.current) {
      router.replace("/onboarding/finish");
    }
  }, [draftPlant]);

  if (!plan) return null;

  const handleConfirm = () => {
    if (!plan || createdRef.current) return;
    setSubmitting(true);
    try {
      const input = buildPlantIntakeInput(plan.values);
      createPlantWithDefaults(db, input, {
        scheduleDrafts: [
          { key: "water", intervalDays: plan.water.intervalDays },
          { key: "fertilize", intervalDays: plan.fert.intervalDays },
        ],
      });
      createdRef.current = true;
      setProfile(db, { completedActivation: true });
      setDraftPlant(null);
      router.push("/onboarding/notify");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Couldn't save plant", message);
      setSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      step={6}
      title={`${plan.nickname}'s care plan is ready`}
      subtitle="We tailored this to your home and the season. You can fine-tune anything later."
      primaryLabel={submitting ? "Saving…" : "Looks great"}
      primaryIcon="checkmark-circle-outline"
      primaryDisabled={submitting}
      onPressPrimary={handleConfirm}
      secondaryLabel="Pick a different plant"
      onPressSecondary={() => router.back()}
    >
      <View className="gap-4">
        <View className="gap-4 rounded-3xl border border-accent/30 bg-surface p-5">
          <PlanRow
            icon="water-outline"
            label="Water"
            interval={plan.water.intervalDays}
          />
          <View className="h-px bg-border/40" />
          <PlanRow
            icon="flask-outline"
            label="Fertilize"
            interval={plan.fert.intervalDays}
          />
        </View>

        {plan.water.rationale.length > 0 ? (
          <RationaleCard reasons={plan.water.rationale} />
        ) : null}
      </View>
    </OnboardingShell>
  );
}

function PlanRow({
  icon,
  label,
  interval,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  interval: number;
}) {
  const accent = useThemeColor("accent");
  const nextDate = addDays(new Date(), interval);

  return (
    <View className="flex-row items-center gap-3">
      <View className="size-11 items-center justify-center rounded-2xl bg-accent-soft">
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-semibold text-base text-foreground">{label}</Text>
        <Text className="text-muted text-sm">
          First time {format(nextDate, "EEE, MMM d")}
        </Text>
      </View>
      <View className="items-end">
        <Text className="font-display text-3xl text-accent leading-tight">
          {interval}
        </Text>
        <Text className="text-muted text-xs">
          {interval === 1 ? "day" : "days"}
        </Text>
      </View>
    </View>
  );
}

function RationaleCard({ reasons }: { reasons: ReadonlyArray<string> }) {
  const accent = useThemeColor("accent");
  return (
    <View className="gap-2 rounded-2xl bg-accent-soft/40 p-4">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name="sparkles" size={14} color={accent} />
        <Text className="font-semibold text-accent text-xs uppercase tracking-wide">
          Why this rhythm
        </Text>
      </View>
      {reasons.slice(0, 3).map((reason) => (
        <View key={reason} className="flex-row gap-2">
          <Text className="text-accent text-xs">•</Text>
          <Text className="flex-1 text-foreground text-xs leading-4">
            {reason}
          </Text>
        </View>
      ))}
    </View>
  );
}
