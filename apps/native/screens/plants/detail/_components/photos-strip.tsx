import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useThemeColor } from "heroui-native";
import { FlatList, Pressable, Text, View } from "react-native";

import { SectionHeader } from "@/components/section-header";
import type { PlantPhoto } from "@/lib/db/types";

type PhotosStripProps = {
  photos: ReadonlyArray<PlantPhoto>;
  onPressSeeAll: () => void;
  onAddPhoto: () => void;
  onPressPhoto?: (photo: PlantPhoto) => void;
};

export function PhotosStrip({
  photos,
  onPressSeeAll,
  onAddPhoto,
  onPressPhoto,
}: PhotosStripProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <View className="gap-3">
      <SectionHeader
        title="Photos"
        count={photos.length}
        actionLabel={photos.length > 0 ? "See all" : undefined}
        onPressAction={onPressSeeAll}
      />
      {photos.length === 0 ? (
        <Pressable
          onPress={onAddPhoto}
          className="flex-row items-center gap-3 rounded-2xl border border-border/40 border-dashed bg-surface p-4"
        >
          <View className="size-10 items-center justify-center rounded-xl bg-accent-soft">
            <Ionicons name="camera-outline" size={18} color={accent} />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-foreground text-sm">
              Capture this plant
            </Text>
            <Text className="text-muted text-xs">
              Photos stay on this device.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={muted} />
        </Pressable>
      ) : (
        <FlatList
          horizontal
          data={photos.slice(0, 8)}
          keyExtractor={(photo) => `strip-${photo.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPressPhoto?.(item)}
              className="size-24 overflow-hidden rounded-2xl bg-muted/15"
            >
              <Image
                source={{ uri: item.uri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={150}
              />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
