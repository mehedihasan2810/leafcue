import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import type { Plant } from "@/lib/db/types";

type PlantRowProps = {
  plant: Plant;
  caption?: string | null;
  trailingValue?: string;
  onPress: () => void;
};

export function PlantRow({
  plant,
  caption,
  trailingValue,
  onPress,
}: PlantRowProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <PressableFeedback
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-border/30 bg-surface p-3"
    >
      <View className="size-10 overflow-hidden rounded-xl bg-muted/15">
        {plant.photoUri ? (
          <Image
            source={{ uri: plant.photoUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="leaf-outline" size={18} color={accent} />
          </View>
        )}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-semibold text-foreground" numberOfLines={1}>
          {plant.nickname}
        </Text>
        {caption ? (
          <Text className="text-muted text-xs" numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
      {trailingValue ? (
        <Text className="font-medium text-muted text-xs">{trailingValue}</Text>
      ) : null}
      <Ionicons name="chevron-forward" size={14} color={muted} />
    </PressableFeedback>
  );
}
