import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { Button, PressableFeedback, useThemeColor } from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { useDatabase } from "@/lib/db";
import {
  addGrowthMeasurement,
  deleteGrowthMeasurement,
  getGrowthMeasurements,
  getPlantById,
} from "@/lib/db/repositories";
import { plants as plantsTable } from "@/lib/db/schema";
import type { GrowthMeasurement } from "@/lib/db/types";

import { GrowthProgressCard } from "@/screens/plants/growth/_components/growth-progress-card";
import { HeightSparkline } from "@/screens/plants/growth/_components/height-sparkline";
import { MeasurementFormSheet } from "@/screens/plants/growth/_components/measurement-form-sheet";

type PlantGrowthScreenProps = {
  plantId: number;
};

export function PlantGrowthScreen({ plantId }: PlantGrowthScreenProps) {
  const insets = useSafeAreaInsets();
  const accentForeground = useThemeColor("accent-foreground");
  const muted = useThemeColor("muted");
  const danger = useThemeColor("danger");
  const db = useDatabase();
  const [open, setOpen] = useState(false);
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>(() =>
    getGrowthMeasurements(db, plantId),
  );

  const livePlants = useLiveQuery(db.select().from(plantsTable));

  const plant = useMemo(() => {
    void livePlants.data;
    return getPlantById(db, plantId);
  }, [db, plantId, livePlants.data]);

  const reloadMeasurements = useCallback(() => {
    setMeasurements(getGrowthMeasurements(db, plantId));
  }, [db, plantId]);

  const handleSubmit = async (input: {
    heightCm: number | null;
    leafCount: number | null;
    bloomCount: number | null;
    notes: string | null;
    measuredAt: Date;
  }) => {
    try {
      addGrowthMeasurement(db, {
        plantId,
        ...input,
      });
      reloadMeasurements();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save measurement";
      Alert.alert("Couldn't save", message);
    }
  };

  const handleDelete = (measurement: GrowthMeasurement) => {
    Alert.alert("Delete measurement?", "This permanently removes this entry.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteGrowthMeasurement(db, measurement.id);
          reloadMeasurements();
        },
      },
    ]);
  };

  if (!plant) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-foreground">Plant not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center justify-between px-6"
        style={{ paddingTop: insets.top + 4, paddingBottom: 12 }}
      >
        <PressableFeedback
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="chevron-back" size={20} color={muted} />
        </PressableFeedback>
        <View className="items-center">
          <Text className="text-muted text-xs">Growth</Text>
          <Text className="font-semibold text-base text-foreground">
            {plant.nickname}
          </Text>
        </View>
        <View className="w-9" />
      </View>

      <FlatList
        data={measurements}
        keyExtractor={(m) => `growth-${m.id}`}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 96,
          gap: 12,
        }}
        ListHeaderComponent={
          <View className="gap-4">
            <GrowthProgressCard plant={plant} measurements={measurements} />
            <HeightSparkline measurements={measurements} />
          </View>
        }
        ListEmptyComponent={
          <View className="">
            <EmptyState
              icon="resize-outline"
              title="No measurements yet"
              description="Track height, leaves, and blooms to watch this plant grow."
              ctaLabel="Log a measurement"
              onPressCta={() => setOpen(true)}
            />
          </View>
        }
        renderItem={({ item }) => (
          <PressableFeedback
            onLongPress={() => handleDelete(item)}
            className="gap-2 rounded-2xl border border-border/30 bg-surface p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-foreground text-sm">
                {format(item.measuredAt, "PPP")}
              </Text>
              <PressableFeedback onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={14} color={danger} />
              </PressableFeedback>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {item.heightCm !== null ? (
                <Field label="Height" value={`${item.heightCm} cm`} />
              ) : null}
              {item.leafCount !== null ? (
                <Field label="Leaves" value={String(item.leafCount)} />
              ) : null}
              {item.bloomCount !== null ? (
                <Field label="Blooms" value={String(item.bloomCount)} />
              ) : null}
            </View>
            {item.notes ? (
              <Text className="text-muted text-xs leading-5">{item.notes}</Text>
            ) : null}
          </PressableFeedback>
        )}
      />

      <View
        className="absolute right-4"
        style={{ bottom: insets.bottom + 12 }}
        pointerEvents="box-none"
      >
        <Button onPress={() => setOpen(true)}>
          <Ionicons name="add" size={18} color={accentForeground} />
          <Button.Label>Log measurement</Button.Label>
        </Button>
      </View>

      <MeasurementFormSheet
        isOpen={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl bg-accent-soft/50 px-3 py-1.5">
      <Text className="font-medium text-muted text-xs">{label}</Text>
      <Text className="font-semibold text-foreground">{value}</Text>
    </View>
  );
}
