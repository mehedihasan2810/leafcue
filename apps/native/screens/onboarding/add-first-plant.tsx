import { router } from "expo-router";
import { cn, Input, Label, PressableFeedback, TextField } from "heroui-native";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useDatabase } from "@/lib/db";
import { getPresets } from "@/lib/db/repositories";
import type { PlantPreset } from "@/lib/db/types";
import { OnboardingShell } from "@/screens/onboarding/_components/onboarding-shell";
import { useOnboardingStore } from "@/stores/use-onboarding-store";

export function OnboardingAddFirstPlantScreen() {
  const db = useDatabase();
  const draftPlant = useOnboardingStore((state) => state.draftPlant);
  const setDraftPlant = useOnboardingStore((state) => state.setDraftPlant);

  const presets = useMemo(() => getPresets(db), [db]);
  const [nickname, setNickname] = useState(draftPlant?.nickname ?? "");
  const [presetId, setPresetId] = useState<number | null>(
    draftPlant?.presetId ?? null,
  );

  const handleSelectPreset = (preset: PlantPreset) => {
    if (presetId === preset.id) {
      setPresetId(null);
      return;
    }
    setPresetId(preset.id);
    if (!nickname.trim()) setNickname(preset.commonName);
  };

  const canContinue = nickname.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    setDraftPlant({ nickname: nickname.trim(), presetId });
    router.push("/onboarding/plan-reveal");
  };

  const handleSkip = () => {
    setDraftPlant(null);
    router.push("/onboarding/finish");
  };

  return (
    <OnboardingShell
      step={5}
      title="Add your first plant"
      subtitle="Give it a name — pick a species if you know it and we'll prefill the care details."
      primaryLabel="See its care plan"
      primaryIcon="sparkles-outline"
      primaryDisabled={!canContinue}
      onPressPrimary={handleContinue}
      secondaryLabel="I'll add one later"
      onPressSecondary={handleSkip}
    >
      <View className="gap-4">
        <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-4">
          <TextField className="gap-1.5">
            <Label>
              <Label.Text>Nickname</Label.Text>
            </Label>
            <Input
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g. Livvy the Monstera"
              autoCapitalize="words"
              returnKeyType="done"
            />
          </TextField>
        </View>

        <View className="gap-2.5">
          <Text className="font-semibold text-base text-foreground">
            Pick a species (optional)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {presets.map((preset) => {
              const selected = presetId === preset.id;
              return (
                <PressableFeedback
                  key={preset.id}
                  onPress={() => handleSelectPreset(preset)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={cn(
                    "rounded-2xl border px-3.5 py-2.5",
                    selected
                      ? "border-accent bg-accent-soft"
                      : "border-border/50 bg-surface",
                  )}
                >
                  <Text
                    className={cn(
                      "font-medium text-sm",
                      selected ? "text-accent" : "text-foreground",
                    )}
                  >
                    {preset.commonName}
                  </Text>
                </PressableFeedback>
              );
            })}
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}
