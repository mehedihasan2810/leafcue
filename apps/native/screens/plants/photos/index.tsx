import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { PhotoViewerDialog } from "@/components/photo-viewer-dialog";
import { useDatabase } from "@/lib/db";
import {
  addPlantPhoto,
  deletePlantPhoto,
  getPlantById,
  getPlantPhotos,
  setPlantPhotoAsCover,
  updatePlant,
  updatePlantPhotoCaption,
} from "@/lib/db/repositories";
import {
  plantPhotos as plantPhotosTable,
  plants as plantsTable,
} from "@/lib/db/schema";
import type { PlantPhoto } from "@/lib/db/types";
import { deletePersistedPhoto, pickPlantPhoto } from "@/lib/photos";

import { BeforeAfterCompare } from "@/screens/plants/photos/_components/before-after-compare";
import { PhotoDetailSheet } from "@/screens/plants/photos/_components/photo-detail-sheet";

type PlantPhotosScreenProps = {
  plantId: number;
};

export function PlantPhotosScreen({ plantId }: PlantPhotosScreenProps) {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const accentForeground = useThemeColor("accent-foreground");
  const muted = useThemeColor("muted");
  const db = useDatabase();
  const [selected, setSelected] = useState<PlantPhoto | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState<PlantPhoto | null>(null);

  const livePlants = useLiveQuery(db.select().from(plantsTable));
  const livePhotos = useLiveQuery(db.select().from(plantPhotosTable));

  const plant = useMemo(
    () => getPlantById(db, plantId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, plantId, livePlants.data.length],
  );

  const photos = useMemo(
    () => getPlantPhotos(db, plantId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, plantId, livePhotos.data.length],
  );

  const handleAddPhoto = async () => {
    try {
      const result = await pickPlantPhoto("library");
      if (result.canceled) return;
      addPlantPhoto(db, {
        plantId,
        uri: result.uri,
        type: photos.length === 0 ? "cover" : "journal",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not add photo";
      Alert.alert("Couldn't add photo", message);
    }
  };

  const handleSaveCaption = (caption: string | null) => {
    if (!selected) return;
    try {
      updatePlantPhotoCaption(db, selected.id, caption);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save caption";
      Alert.alert("Couldn't save", message);
    }
  };

  const handleSetCover = (photo?: PlantPhoto | null) => {
    const target = photo ?? selected;
    if (!target) return;
    try {
      setPlantPhotoAsCover(db, target.id);
      if (viewerPhoto?.id === target.id) setViewerPhoto(null);
      if (selected?.id === target.id) setSelected(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not set cover";
      Alert.alert("Couldn't update", message);
    }
  };

  const handleDeletePhoto = (photo?: PlantPhoto | null) => {
    const target = photo ?? selected;
    if (!target) return;
    Alert.alert("Delete photo?", "This permanently removes the photo.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deletePlantPhoto(db, target.id);
          deletePersistedPhoto(target.uri);
          if (plant?.photoUri === target.uri) {
            updatePlant(db, plantId, { photoUri: null });
          }
          // Clear viewer/bottom sheet if they show the deleted photo
          if (viewerPhoto?.id === target.id) setViewerPhoto(null);
          if (selected?.id === target.id) setSelected(null);
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
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="chevron-back" size={20} color={muted} />
        </Pressable>
        <View className="items-center">
          <Text className="text-muted text-xs">Photos</Text>
          <Text className="font-semibold text-base text-foreground">
            {plant.nickname}
          </Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => setShowCompare((prev) => !prev)}
          className="size-9 items-center justify-center rounded-full bg-surface"
          accessibilityLabel="Toggle compare"
        >
          <Ionicons
            name={showCompare ? "close-outline" : "git-compare-outline"}
            size={18}
            color={accent}
          />
        </Pressable>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(photo) => `photo-${photo.id}`}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + 96,
          gap: 12,
        }}
        ListHeaderComponent={
          showCompare && photos.length >= 2 ? (
            <View className="px-4">
              <BeforeAfterCompare
                photos={photos}
                onClose={() => setShowCompare(false)}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="px-4">
            <EmptyState
              icon="camera-outline"
              title="No photos yet"
              description="Snap a photo to start a visual diary of this plant."
              ctaLabel="Add a photo"
              onPressCta={() => void handleAddPhoto()}
            />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setViewerPhoto(item)}
            className="aspect-square flex-1 overflow-hidden rounded-2xl bg-muted/15"
          >
            <Image
              source={{ uri: item.uri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={150}
            />
            {item.type === "cover" ? (
              <View className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5">
                <Text className="font-medium text-foreground text-xs">
                  Cover
                </Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />

      <View
        className="absolute right-4"
        style={{ bottom: insets.bottom + 12 }}
        pointerEvents="box-none"
      >
        <Button onPress={() => void handleAddPhoto()}>
          <Ionicons name="add" size={18} color={accentForeground} />
          <Button.Label>Add photo</Button.Label>
        </Button>
      </View>

      <PhotoDetailSheet
        isOpen={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        photo={selected}
        onSaveCaption={handleSaveCaption}
        onSetCover={() => handleSetCover()}
        onDelete={() => handleDeletePhoto()}
      />

      <PhotoViewerDialog
        isOpen={viewerPhoto !== null}
        onOpenChange={(open) => {
          if (!open) setViewerPhoto(null);
        }}
        photo={viewerPhoto}
        onSetCover={() => handleSetCover(viewerPhoto)}
        onDelete={() => handleDeletePhoto(viewerPhoto)}
      />
    </View>
  );
}
