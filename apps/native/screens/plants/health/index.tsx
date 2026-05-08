import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { Button, PressableFeedback, useThemeColor } from "heroui-native";
import { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";
import { useDatabase } from "@/lib/db";
import {
  addHealthObservation,
  deleteHealthObservation,
  getHealthObservations,
  getPlantById,
  updateHealthObservation,
  updateHealthObservationStatus,
} from "@/lib/db/repositories";
import {
  healthObservations as healthObservationsTable,
  plants as plantsTable,
} from "@/lib/db/schema";
import type { HealthObservation } from "@/lib/db/types";

import { ObservationCard } from "@/screens/plants/health/_components/observation-card";
import { ObservationFormSheet } from "@/screens/plants/health/_components/observation-form-sheet";

type PlantHealthScreenProps = {
  plantId: number;
};

export function PlantHealthScreen({ plantId }: PlantHealthScreenProps) {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const db = useDatabase();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HealthObservation | null>(null);

  const livePlants = useLiveQuery(db.select().from(plantsTable));
  const liveObservations = useLiveQuery(
    db.select().from(healthObservationsTable),
  );

  const plant = useMemo(() => {
    void livePlants.data;
    return getPlantById(db, plantId);
  }, [db, plantId, livePlants.data]);

  const observations = useMemo(() => {
    void liveObservations.data;
    return getHealthObservations(db, plantId);
  }, [db, plantId, liveObservations.data]);

  const grouped = useMemo(() => {
    const active = observations.filter((obs) => obs.status === "active");
    const improving = observations.filter((obs) => obs.status === "improving");
    const resolved = observations.filter((obs) => obs.status === "resolved");
    return { active, improving, resolved };
  }, [observations]);

  const handleSubmit = async (input: {
    issueType: string;
    severity: HealthObservation["severity"];
    status: HealthObservation["status"];
    observedAt: Date;
    notes: string | null;
  }) => {
    try {
      if (editing) {
        updateHealthObservation(db, editing.id, {
          issueType: input.issueType,
          severity: input.severity,
          status: input.status,
          observedAt: input.observedAt,
          notes: input.notes,
        });
      } else {
        addHealthObservation(db, {
          plantId,
          issueType: input.issueType,
          severity: input.severity,
          status: input.status,
          observedAt: input.observedAt,
          notes: input.notes,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save observation";
      Alert.alert("Couldn't save", message);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    const id = editing.id;
    Alert.alert("Delete observation?", "This permanently removes this entry.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteHealthObservation(db, id);
          setOpen(false);
          setEditing(null);
        },
      },
    ]);
  };

  const handleStatusChange = (
    observation: HealthObservation,
    status: HealthObservation["status"],
  ) => {
    try {
      updateHealthObservationStatus(db, observation.id, status);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update status";
      Alert.alert("Couldn't update", message);
    }
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

  const sections: ReadonlyArray<{
    title: string;
    items: HealthObservation[];
  }> = [
    { title: "Active", items: grouped.active },
    { title: "Improving", items: grouped.improving },
    { title: "Resolved", items: grouped.resolved },
  ];

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
          <Text className="text-muted text-xs">Health</Text>
          <Text className="font-semibold text-base text-foreground">
            {plant.nickname}
          </Text>
        </View>
        <View className="w-9" />
      </View>

      <Container
        isScrollable
        scrollViewProps={{
          contentContainerStyle: {
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 96,
          },
        }}
      >
        <View className="gap-6">
          {observations.length === 0 ? (
            <EmptyState
              icon="medkit-outline"
              title="No observations yet"
              description="Log a health observation when you notice anything off. Hints are advisory, not diagnostic."
              ctaLabel="Log observation"
              onPressCta={() => {
                setEditing(null);
                setOpen(true);
              }}
            />
          ) : null}
          {sections.map((section) => (
            <View key={`section-${section.title}`} className="gap-3">
              <SectionHeader
                title={section.title}
                count={section.items.length}
              />
              {section.items.length === 0 ? (
                <View className="rounded-2xl border border-border/30 bg-surface p-4">
                  <Text className="text-muted text-sm">
                    Nothing in {section.title.toLowerCase()}.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {section.items.map((obs) => (
                    <ObservationCard
                      key={`obs-${obs.id}`}
                      observation={obs}
                      onPressEdit={() => {
                        setEditing(obs);
                        setOpen(true);
                      }}
                      onPressMarkImproving={
                        obs.status === "active"
                          ? () => handleStatusChange(obs, "improving")
                          : undefined
                      }
                      onPressMarkResolved={
                        obs.status !== "resolved"
                          ? () => handleStatusChange(obs, "resolved")
                          : undefined
                      }
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </Container>

      <View
        className="absolute right-5"
        style={{ bottom: insets.bottom + 12 }}
        pointerEvents="box-none"
      >
        <Button
          onPress={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Ionicons name="add" size={18} color={accent} />
          <Button.Label>Log observation</Button.Label>
        </Button>
      </View>

      <ObservationFormSheet
        isOpen={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditing(null);
        }}
        initial={editing}
        onSubmit={handleSubmit}
        onDelete={editing ? handleDelete : undefined}
      />
    </View>
  );
}
