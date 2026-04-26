import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Image } from "expo-image";
import {
  BottomSheet,
  Button,
  Input,
  Label,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { PlantPhoto } from "@/lib/db/types";

type PhotoDetailSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  photo: PlantPhoto | null;
  onSaveCaption: (caption: string | null) => void;
  onSetCover: () => void;
  onDelete: () => void;
};

export function PhotoDetailSheet({
  isOpen,
  onOpenChange,
  photo,
  onSaveCaption,
  onSetCover,
  onDelete,
}: PhotoDetailSheetProps) {
  const accent = useThemeColor("accent");
  const danger = useThemeColor("danger");
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (photo) {
      setCaption(photo.caption ?? "");
    } else {
      setCaption("");
    }
  }, [photo]);

  if (!photo) return null;

  const isCover = photo.type === "cover";

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["75%", "92%"]}>
          <View className="gap-4">
            <View>
              <BottomSheet.Title className="text-foreground">
                Photo
              </BottomSheet.Title>
              <BottomSheet.Description className="text-muted">
                {format(photo.takenAt, "PPP")}
              </BottomSheet.Description>
            </View>

            <View className="aspect-square overflow-hidden rounded-2xl bg-muted/15">
              <Image
                source={{ uri: photo.uri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={150}
              />
            </View>

            <TextField className="gap-1.5">
              <Label>
                <Label.Text>Caption</Label.Text>
              </Label>
              <Input
                value={caption}
                onChangeText={setCaption}
                placeholder="Optional"
                maxLength={500}
              />
            </TextField>

            <View className="gap-2">
              <Button
                variant="secondary"
                onPress={() => {
                  onSaveCaption(caption.trim() || null);
                  onOpenChange(false);
                }}
              >
                <Ionicons name="save-outline" size={14} color={accent} />
                <Button.Label>Save caption</Button.Label>
              </Button>
              <Button
                variant="secondary"
                isDisabled={isCover}
                onPress={() => {
                  onSetCover();
                  onOpenChange(false);
                }}
              >
                <Ionicons name="image-outline" size={14} color={accent} />
                <Button.Label>
                  {isCover ? "Already cover photo" : "Set as cover"}
                </Button.Label>
              </Button>
              <Button
                variant="ghost"
                onPress={() => {
                  onDelete();
                  onOpenChange(false);
                }}
              >
                <Ionicons name="trash-outline" size={14} color={danger} />
                <Button.Label style={{ color: danger }}>Delete</Button.Label>
              </Button>
              <Button variant="ghost" onPress={() => onOpenChange(false)}>
                <Button.Label>Close</Button.Label>
              </Button>
            </View>

            <Text className="text-center text-muted text-xs">
              Photos stay on this device.
            </Text>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
