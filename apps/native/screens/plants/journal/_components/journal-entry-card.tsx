import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Image } from "expo-image";
import { Chip, PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import type { JournalEntry } from "@/lib/db/types";

type JournalEntryCardProps = {
  entry: JournalEntry;
  onPress: () => void;
};

const ENTRY_ICON: Record<
  JournalEntry["entryType"],
  keyof typeof Ionicons.glyphMap
> = {
  note: "create-outline",
  milestone: "trophy-outline",
  issue: "alert-circle-outline",
  treatment: "medkit-outline",
  observation: "eye-outline",
};

export function JournalEntryCard({ entry, onPress }: JournalEntryCardProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <PressableFeedback
      onPress={onPress}
      className="gap-2 rounded-2xl border border-border/30 bg-surface p-4"
    >
      <View className="flex-row items-center gap-2">
        <View className="size-9 items-center justify-center rounded-xl bg-accent-soft">
          <Ionicons
            name={ENTRY_ICON[entry.entryType]}
            size={16}
            color={accent}
          />
        </View>
        <View className="flex-1 gap-0.5">
          {entry.title ? (
            <Text className="font-semibold text-foreground" numberOfLines={1}>
              {entry.title}
            </Text>
          ) : (
            <Text className="font-semibold text-foreground" numberOfLines={1}>
              {entry.entryType.charAt(0).toUpperCase() +
                entry.entryType.slice(1)}
            </Text>
          )}
          <Text className="text-muted text-xs">
            {format(entry.createdAt, "PPP · p")}
          </Text>
        </View>
        {entry.mood ? (
          <Chip variant="soft" size="sm" color="default">
            <Chip.Label>{entry.mood}</Chip.Label>
          </Chip>
        ) : null}
      </View>
      <Text className="text-foreground text-sm leading-5" numberOfLines={5}>
        {entry.body}
      </Text>
      {entry.photoUri ? (
        <View className="mt-1 h-40 overflow-hidden rounded-2xl bg-muted/15">
          <Image
            source={{ uri: entry.photoUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={150}
          />
        </View>
      ) : null}
      <View className="flex-row items-center gap-1 pt-1">
        <Ionicons name="chevron-forward" size={12} color={muted} />
        <Text className="text-muted text-xs">Tap to edit</Text>
      </View>
    </PressableFeedback>
  );
}
