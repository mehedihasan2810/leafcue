import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Chip, PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { relativeDueLabel } from "@/lib/dates";
import type { Plant, Room, Shelf } from "@/lib/db/types";

type HeroStatus = "healthy" | "needs_attention" | "in_recovery";

type HeroCardProps = {
  plant: Plant;
  room: Room | null;
  shelf: Shelf | null;
  nextDueAt: Date | null;
  nextDueLabel: string | null;
  status: HeroStatus;
  onToggleFavorite: () => void;
};

const STATUS_LABEL: Record<HeroStatus, string> = {
  healthy: "Looking happy",
  needs_attention: "Needs attention",
  in_recovery: "In recovery",
};

const STATUS_TONE: Record<
  HeroStatus,
  "success" | "warning" | "default" | "danger" | "accent"
> = {
  healthy: "success",
  needs_attention: "danger",
  in_recovery: "warning",
};

export function HeroCard({
  plant,
  room,
  shelf,
  nextDueAt,
  nextDueLabel,
  status,
  onToggleFavorite,
}: HeroCardProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const favoriteColor = useThemeColor("warning");

  return (
    <View className="overflow-hidden rounded-3xl border border-border/40 bg-surface">
      <View className="aspect-[5/3] w-full bg-muted/15">
        {plant.photoUri ? (
          <Image
            source={{ uri: plant.photoUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="leaf-outline" size={56} color={accent} />
          </View>
        )}
        <View className="absolute top-3 right-3 flex-row gap-2">
          <PressableFeedback
            onPress={onToggleFavorite}
            className="size-10 items-center justify-center rounded-full bg-background/85"
            accessibilityLabel={
              plant.isFavorite ? "Unfavorite plant" : "Favorite plant"
            }
          >
            <Ionicons
              name={plant.isFavorite ? "star" : "star-outline"}
              size={18}
              color={plant.isFavorite ? favoriteColor : muted}
            />
          </PressableFeedback>
        </View>
      </View>

      <View className="gap-3 px-4 py-4">
        <View className="gap-1">
          <Text
            className="font-display text-2xl text-foreground"
            numberOfLines={1}
          >
            {plant.nickname}
          </Text>
          {plant.commonName || plant.scientificName ? (
            <Text className="text-muted text-sm italic" numberOfLines={1}>
              {[plant.commonName, plant.scientificName]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          ) : null}
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Chip variant="soft" size="sm" color={STATUS_TONE[status]}>
            <Ionicons
              name={
                status === "healthy"
                  ? "leaf-outline"
                  : status === "needs_attention"
                    ? "alert-circle-outline"
                    : "medkit-outline"
              }
              size={12}
              color={muted}
            />
            <Chip.Label>{STATUS_LABEL[status]}</Chip.Label>
          </Chip>
          {room ? (
            <Chip variant="secondary" size="sm" color="default">
              <Ionicons
                name={
                  (room.icon as keyof typeof Ionicons.glyphMap | undefined) ??
                  "home-outline"
                }
                size={12}
                color={muted}
              />
              <Chip.Label>
                {room.name}
                {shelf ? ` · ${shelf.name}` : ""}
              </Chip.Label>
            </Chip>
          ) : null}
          {nextDueAt ? (
            <Chip variant="soft" size="sm" color="accent">
              <Ionicons name="time-outline" size={12} color={accent} />
              <Chip.Label>
                {nextDueLabel ?? relativeDueLabel(nextDueAt)}
              </Chip.Label>
            </Chip>
          ) : null}
        </View>
      </View>
    </View>
  );
}
