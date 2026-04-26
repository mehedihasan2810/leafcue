import { Button, Input, Label, TextField } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { SectionHeader } from "@/components/section-header";
import { useDatabase } from "@/lib/db";
import {
  loadPlantDefaults,
  savePlantDefaults,
} from "@/lib/settings/app-settings";
import { SettingsHeader } from "@/screens/settings/settings-header";

function fmt(value: number | null): string {
  return value === null ? "" : String(value);
}

type IntervalParse =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "ok"; value: number };

function parseInterval(text: string): IntervalParse {
  const trimmed = text.trim();
  if (trimmed === "") return { kind: "empty" };
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > 365) {
    return { kind: "invalid" };
  }
  return { kind: "ok", value: n };
}

function intervalValue(parsed: IntervalParse): number | null {
  return parsed.kind === "ok" ? parsed.value : null;
}

export function PlantDefaultsScreen() {
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const [defaults] = useState(() => loadPlantDefaults(db));

  const [waterText, setWaterText] = useState(fmt(defaults.waterIntervalDays));
  const [fertText, setFertText] = useState(fmt(defaults.fertilizeIntervalDays));
  const [mistText, setMistText] = useState(fmt(defaults.mistIntervalDays));
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const water = parseInterval(waterText);
  const fert = parseInterval(fertText);
  const mist = parseInterval(mistText);
  const hasError =
    water.kind === "invalid" ||
    fert.kind === "invalid" ||
    mist.kind === "invalid";

  const onSave = () => {
    if (hasError) return;
    savePlantDefaults(db, {
      waterIntervalDays: intervalValue(water),
      fertilizeIntervalDays: intervalValue(fert),
      mistIntervalDays: intervalValue(mist),
    });
    setSavedAt(Date.now());
  };

  return (
    <View className="flex-1 bg-background">
      <SettingsHeader title="Plant defaults" />
      <Container className="px-6" isScrollable>
        <View className="gap-6" style={{ paddingBottom: insets.bottom + 32 }}>
          <SectionHeader
            title="Default care intervals"
            caption="Used when adding a new plant. Leave blank to keep system suggestions."
          />
          <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
            <TextField className="gap-1.5" isInvalid={water.kind === "invalid"}>
              <Label>
                <Label.Text>Water (days)</Label.Text>
              </Label>
              <Input
                value={waterText}
                onChangeText={setWaterText}
                keyboardType="number-pad"
                maxLength={3}
                accessibilityLabel="Water interval in days"
              />
            </TextField>

            <TextField className="gap-1.5" isInvalid={fert.kind === "invalid"}>
              <Label>
                <Label.Text>Fertilize (days)</Label.Text>
              </Label>
              <Input
                value={fertText}
                onChangeText={setFertText}
                keyboardType="number-pad"
                maxLength={3}
                accessibilityLabel="Fertilize interval in days"
              />
            </TextField>

            <TextField className="gap-1.5" isInvalid={mist.kind === "invalid"}>
              <Label>
                <Label.Text>Mist (days)</Label.Text>
              </Label>
              <Input
                value={mistText}
                onChangeText={setMistText}
                keyboardType="number-pad"
                maxLength={3}
                accessibilityLabel="Mist interval in days"
              />
            </TextField>

            <Button
              isDisabled={hasError}
              onPress={onSave}
              accessibilityLabel="Save plant defaults"
            >
              <Button.Label>Save defaults</Button.Label>
            </Button>

            {savedAt !== null ? (
              <Text className="text-center text-muted text-xs">Saved.</Text>
            ) : null}
          </View>
          <Text className="px-1 text-muted text-xs">
            These overrides only apply to new plants. Existing schedules are
            unchanged.
          </Text>
        </View>
      </Container>
    </View>
  );
}
