import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { cn, useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";

import { relativeDueLabel } from "@/lib/dates";
import type { Plant } from "@/lib/db/types";

type PlantCardProps = {
  plant: Plant;
  roomName?: string | null;
  shelfName?: string | null;
  nextDueAt?: Date | null;
  isOverdue?: boolean;
  onPress?: (plant: Plant) => void;
  onLongPress?: (plant: Plant) => void;
  variant?: "grid" | "list";
  className?: string;
};

export function PlantCard({
  plant,
  roomName,
  shelfName,
  nextDueAt,
  isOverdue: overdue,
  onPress,
  onLongPress,
  variant = "grid",
  className,
}: PlantCardProps) {
  const accentColor = useThemeColor("accent");
  const dangerColor = useThemeColor("danger");
  const successColor = useThemeColor("success");

  const dueLabel = relativeDueLabel(nextDueAt ?? null);
  const dueColor = overdue
    ? dangerColor
    : nextDueAt
      ? successColor
      : accentColor;

  const handlePress = () => onPress?.(plant);
  const handleLongPress = () => onLongPress?.(plant);

  if (variant === "list") {
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        className={cn(
          "flex-row items-center gap-3 rounded-2xl border border-border/40 bg-surface p-3",
          className,
        )}
      >
        <View className="size-16 overflow-hidden rounded-xl bg-muted/15">
          {plant.photoUri ? (
            <Image
              source={{ uri: plant.photoUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="leaf-outline" size={26} color={accentColor} />
            </View>
          )}
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-1.5">
            <Text
              numberOfLines={1}
              className="font-semibold text-base text-foreground"
            >
              {plant.nickname}
            </Text>
            {plant.isFavorite ? (
              <Ionicons name="star" size={12} color="#f5b301" />
            ) : null}
          </View>
          {plant.commonName || plant.scientificName ? (
            <Text numberOfLines={1} className="text-muted text-xs italic">
              {plant.commonName ?? plant.scientificName}
            </Text>
          ) : null}
          <View className="flex-row items-center gap-2">
            {roomName ? (
              <Text className="text-muted text-xs" numberOfLines={1}>
                {roomName}
                {shelfName ? ` · ${shelfName}` : ""}
              </Text>
            ) : null}
          </View>
        </View>
        <View className="items-end gap-1">
          <Ionicons name="time-outline" size={14} color={dueColor} />
          <Text className="text-xs" style={{ color: dueColor }}>
            {dueLabel}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      className={cn(
        "gap-2 overflow-hidden rounded-3xl border border-border/40 bg-surface",
        className,
      )}
    >
      <View className="aspect-square w-full overflow-hidden bg-muted/15">
        {plant.photoUri ? (
          <Image
            source={{ uri: plant.photoUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="leaf-outline" size={42} color={accentColor} />
          </View>
        )}
        {plant.isFavorite ? (
          <View className="absolute top-2 right-2 size-7 items-center justify-center rounded-full bg-background/90">
            <Ionicons name="star" size={14} color="#f5b301" />
          </View>
        ) : null}
      </View>

      <View className="gap-1 px-3 pb-3">
        <Text
          numberOfLines={1}
          className="font-semibold text-base text-foreground"
        >
          {plant.nickname}
        </Text>
        {plant.commonName || plant.scientificName ? (
          <Text numberOfLines={1} className="text-muted text-xs italic">
            {plant.commonName ?? plant.scientificName}
          </Text>
        ) : null}
        <View className="mt-1 flex-row items-center justify-between gap-2">
          {roomName ? (
            <Text className="flex-1 text-muted text-xs" numberOfLines={1}>
              {roomName}
            </Text>
          ) : (
            <View className="flex-1" />
          )}
          <View className="flex-row items-center gap-1">
            <Ionicons name="water-outline" size={12} color={dueColor} />
            <Text className="text-xs" style={{ color: dueColor }}>
              {dueLabel}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
