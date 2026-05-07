import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Button, cn, PressableFeedback, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import {
  deletePersistedPhoto,
  type PickPhotoSource,
  pickPlantPhoto,
} from "@/lib/photos";

type PhotoPickerFieldProps = {
  value: string | null | undefined;
  onChange: (uri: string | null) => void;
  size?: number;
  className?: string;
  description?: string;
};

export function PhotoPickerField({
  value,
  onChange,
  size = 120,
  className,
  description,
}: PhotoPickerFieldProps) {
  const accent = useThemeColor("accent");
  const [isWorking, setIsWorking] = useState(false);

  const handlePick = async (source: PickPhotoSource) => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const result = await pickPlantPhoto(source);
      if (!result.canceled) {
        if (value && value !== result.uri) {
          deletePersistedPhoto(value);
        }
        onChange(result.uri);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not pick a photo";
      Alert.alert("Photo error", message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleClear = () => {
    if (value) {
      deletePersistedPhoto(value);
    }
    onChange(null);
  };

  return (
    <View className={cn("gap-3", className)}>
      <View className="flex-row items-center gap-4">
        <PressableFeedback
          onPress={() => handlePick("library")}
          isDisabled={isWorking}
          className="overflow-hidden rounded-2xl border border-border/40 bg-muted/15"
          style={{ width: size, height: size }}
          accessibilityLabel={value ? "Change plant photo" : "Add plant photo"}
        >
          {value ? (
            <Image
              source={{ uri: value }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View className="flex-1 items-center justify-center gap-1">
              <Ionicons name="camera-outline" size={28} color={accent} />
              <Text className="text-muted text-xs">Add photo</Text>
            </View>
          )}
        </PressableFeedback>
        <View className="flex-1 gap-2">
          <Button
            size="sm"
            variant="secondary"
            isDisabled={isWorking}
            onPress={() => handlePick("library")}
          >
            <Ionicons name="images-outline" size={16} color={accent} />
            <Button.Label>From library</Button.Label>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isDisabled={isWorking}
            onPress={() => handlePick("camera")}
          >
            <Ionicons name="camera-outline" size={16} color={accent} />
            <Button.Label>Use camera</Button.Label>
          </Button>
          {value ? (
            <Button
              size="sm"
              variant="ghost"
              isDisabled={isWorking}
              onPress={handleClear}
            >
              <Button.Label>Remove photo</Button.Label>
            </Button>
          ) : null}
        </View>
      </View>
      {description ? (
        <Text className="text-muted text-xs">{description}</Text>
      ) : null}
    </View>
  );
}
