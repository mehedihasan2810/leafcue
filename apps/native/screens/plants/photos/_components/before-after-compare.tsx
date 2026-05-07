import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Image } from "expo-image";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { useMemo } from "react";
import { Text, View } from "react-native";

import type { PlantPhoto } from "@/lib/db/types";

type BeforeAfterCompareProps = {
  photos: ReadonlyArray<PlantPhoto>;
  onClose: () => void;
};

export function BeforeAfterCompare({
  photos,
  onClose,
}: BeforeAfterCompareProps) {
  const muted = useThemeColor("muted");
  const accent = useThemeColor("accent");

  const { earliest, latest } = useMemo(() => {
    if (photos.length === 0) {
      return { earliest: null, latest: null };
    }
    const sorted = [...photos].sort(
      (a, b) => a.takenAt.getTime() - b.takenAt.getTime(),
    );
    return {
      earliest: sorted[0] ?? null,
      latest: sorted[sorted.length - 1] ?? null,
    };
  }, [photos]);

  return (
    <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="git-compare-outline" size={16} color={accent} />
          <Text className="font-semibold text-foreground">Before · After</Text>
        </View>
        <PressableFeedback onPress={onClose}>
          <Ionicons name="close" size={18} color={muted} />
        </PressableFeedback>
      </View>

      {earliest && latest && earliest.id !== latest.id ? (
        <View className="flex-row gap-3">
          <Pane label="Earliest" date={earliest.takenAt} uri={earliest.uri} />
          <Pane label="Most recent" date={latest.takenAt} uri={latest.uri} />
        </View>
      ) : (
        <Text className="text-muted text-sm">
          Capture at least two photos on different days to see a before/after.
        </Text>
      )}
    </View>
  );
}

function Pane({
  label,
  date,
  uri,
}: {
  label: string;
  date: Date;
  uri: string;
}) {
  return (
    <View className="flex-1 gap-2">
      <View className="aspect-square overflow-hidden rounded-2xl bg-muted/15">
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={150}
        />
      </View>
      <View>
        <Text className="text-muted text-xs">{label}</Text>
        <Text className="font-medium text-foreground text-sm">
          {format(date, "MMM d, yyyy")}
        </Text>
      </View>
    </View>
  );
}
