import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { Button, PressableFeedback, useThemeColor } from "heroui-native";
import { useMemo, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { useDatabase } from "@/lib/db";
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntriesForPlant,
  getPlantById,
  updateJournalEntry,
} from "@/lib/db/repositories";
import {
  journalEntries as journalEntriesTable,
  plants as plantsTable,
} from "@/lib/db/schema";
import type { JournalEntry } from "@/lib/db/types";

import { JournalEntryCard } from "@/screens/plants/journal/_components/journal-entry-card";
import { JournalFormSheet } from "@/screens/plants/journal/_components/journal-form-sheet";

type PlantJournalScreenProps = {
  plantId: number;
};

export function PlantJournalScreen({ plantId }: PlantJournalScreenProps) {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const db = useDatabase();
  const [isOpen, setOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);

  const livePlants = useLiveQuery(db.select().from(plantsTable));
  const liveEntries = useLiveQuery(db.select().from(journalEntriesTable));

  const plant = useMemo(() => {
    void livePlants.data;
    return getPlantById(db, plantId);
  }, [db, plantId, livePlants.data]);

  const entries = useMemo(() => {
    void liveEntries.data;
    return getJournalEntriesForPlant(db, plantId);
  }, [db, plantId, liveEntries.data]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditing(entry);
    setOpen(true);
  };

  const handleSubmit = async (input: {
    title?: string | null;
    body: string;
    mood?: string | null;
    entryType?: JournalEntry["entryType"];
    photoUri?: string | null;
  }) => {
    try {
      if (editing) {
        updateJournalEntry(db, editing.id, {
          title: input.title ?? null,
          body: input.body,
          mood: input.mood ?? null,
          entryType: input.entryType ?? editing.entryType,
          photoUri: input.photoUri ?? null,
        });
      } else {
        createJournalEntry(db, {
          plantId,
          title: input.title ?? null,
          body: input.body,
          mood: input.mood ?? null,
          entryType: input.entryType ?? "note",
          photoUri: input.photoUri ?? null,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save entry";
      Alert.alert("Couldn't save", message);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    const id = editing.id;
    Alert.alert(
      "Delete entry?",
      "This removes the journal entry permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteJournalEntry(db, id);
            setOpen(false);
            setEditing(null);
          },
        },
      ],
    );
  };

  if (!plant) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-6"
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
        style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
      >
        <PressableFeedback
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="chevron-back" size={20} color={muted} />
        </PressableFeedback>
        <View className="items-center">
          <Text className="text-muted text-xs">Journal</Text>
          <Text className="font-semibold text-base text-foreground">
            {plant.nickname}
          </Text>
        </View>
        <View className="w-9" />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(entry) => `journal-${entry.id}`}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 96,
          gap: 12,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="create-outline"
            title="Capture this plant's story"
            description="Notes, milestones, and observations stay on this device."
            ctaLabel="New entry"
            onPressCta={openCreate}
          />
        }
        renderItem={({ item }) => (
          <JournalEntryCard entry={item} onPress={() => openEdit(item)} />
        )}
      />

      <View
        className="absolute right-5"
        style={{ bottom: insets.bottom + 12 }}
        pointerEvents="box-none"
      >
        <Button onPress={openCreate}>
          <Ionicons name="add" size={18} color={accent} />
          <Button.Label>New entry</Button.Label>
        </Button>
      </View>

      <JournalFormSheet
        isOpen={isOpen}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) setEditing(null);
        }}
        initial={editing}
        onSubmit={handleSubmit}
        onDelete={editing ? handleDelete : undefined}
      />
    </View>
  );
}
