import { Ionicons } from "@expo/vector-icons";
import { Button, PressableFeedback, useThemeColor } from "heroui-native";
import { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { SectionHeader } from "@/components/section-header";
import { useDatabase } from "@/lib/db";
import {
  deletePlantPermanently,
  getArchivedPlants,
  unarchivePlant,
} from "@/lib/db/repositories";
import type { Plant } from "@/lib/db/types";
import { SettingsHeader } from "@/screens/settings/settings-header";

function formatDate(value: Date | null): string {
  if (!value) return "";
  try {
    return value.toLocaleDateString();
  } catch {
    return "";
  }
}

export function ArchiveSettingsScreen() {
  const insets = useSafeAreaInsets();
  const danger = useThemeColor("danger");
  const accent = useThemeColor("accent");
  const db = useDatabase();
  const [plants, setPlants] = useState<Plant[]>(() => getArchivedPlants(db));

  const refresh = useCallback(() => {
    setPlants(getArchivedPlants(db));
  }, [db]);

  const onUnarchive = (plant: Plant) => {
    try {
      unarchivePlant(db, plant.id);
      refresh();
    } catch (err) {
      Alert.alert(
        "Could not unarchive",
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  };

  const onDelete = (plant: Plant) => {
    Alert.alert(
      `Delete ${plant.nickname}?`,
      "This permanently removes the plant and all its logs, photos, schedules, and journal entries. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete forever",
          style: "destructive",
          onPress: () => {
            try {
              deletePlantPermanently(db, plant.id);
              refresh();
            } catch (err) {
              Alert.alert(
                "Could not delete",
                err instanceof Error ? err.message : "Unknown error",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <SettingsHeader title="Archive" />
      <Container className="px-6" isScrollable>
        <View className="gap-4" style={{ paddingBottom: insets.bottom + 32 }}>
          <SectionHeader
            title="Archived plants"
            count={plants.length}
            caption="Restore or permanently delete plants you've archived."
          />
          {plants.length === 0 ? (
            <View className="items-center gap-2 rounded-3xl border border-border/40 bg-surface p-6">
              <Ionicons name="leaf-outline" size={28} color={accent} />
              <Text className="text-center font-medium text-foreground text-sm">
                Nothing archived
              </Text>
              <Text className="text-center text-muted text-xs">
                Plants you archive from the plant detail screen will appear
                here.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {plants.map((plant) => (
                <View
                  key={plant.id}
                  className="gap-3 rounded-3xl border border-border/40 bg-surface p-4"
                >
                  <View className="flex-row items-start gap-3">
                    <View className="size-10 items-center justify-center rounded-2xl bg-muted/15">
                      <Ionicons name="archive-outline" size={18} />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text className="font-semibold text-base text-foreground">
                        {plant.nickname}
                      </Text>
                      {plant.commonName ? (
                        <Text className="text-muted text-xs">
                          {plant.commonName}
                        </Text>
                      ) : null}
                      <Text className="text-muted text-xs">
                        Archived {formatDate(plant.archivedAt)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onPress={() => onUnarchive(plant)}
                      accessibilityLabel={`Unarchive ${plant.nickname}`}
                    >
                      <Button.Label>Unarchive</Button.Label>
                    </Button>
                    <PressableFeedback
                      accessibilityLabel={`Permanently delete ${plant.nickname}`}
                      accessibilityHint="This cannot be undone."
                      onPress={() => onDelete(plant)}
                      className="flex-1 items-center justify-center rounded-2xl bg-danger-soft/40 p-3"
                    >
                      <Text
                        className="font-medium text-sm"
                        style={{ color: danger }}
                      >
                        Delete forever
                      </Text>
                    </PressableFeedback>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </Container>
    </View>
  );
}
