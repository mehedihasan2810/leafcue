import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import {
  Input,
  Label,
  PressableFeedback,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { useDatabase } from "@/lib/db";
import { createRoom, deleteRoom } from "@/lib/db/repositories";
import { rooms } from "@/lib/db/schema";
import { OnboardingIllustration } from "@/screens/onboarding/_components/onboarding-illustration";
import { OnboardingShell } from "@/screens/onboarding/_components/onboarding-shell";

export function OnboardingRoomScreen() {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const db = useDatabase();
  const liveRooms = useLiveQuery(db.select().from(rooms));
  const [customRoom, setCustomRoom] = useState("");

  const handleAdd = () => {
    const trimmed = customRoom.trim();
    if (!trimmed) return;
    createRoom(db, {
      name: trimmed,
      icon: "home-outline",
      sortOrder: liveRooms.data.length,
    });
    setCustomRoom("");
  };

  const handleToggle = (roomId: number) => {
    deleteRoom(db, roomId);
  };

  const hasRooms = liveRooms.data.length > 0;

  return (
    <OnboardingShell
      step={4}
      title="Where do your plants live?"
      subtitle="Tap to remove rooms you don't need, or add your own. You can edit them later."
      illustration={<OnboardingIllustration variant="room" />}
      primaryLabel="Looks good"
      primaryIcon="arrow-forward-outline"
      primaryDisabled={!hasRooms}
      onPressPrimary={() => router.push("/onboarding/finish")}
      secondaryLabel="Back"
      onPressSecondary={() => router.back()}
    >
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          {liveRooms.data.map((room) => (
            <PressableFeedback
              key={room.id}
              onPress={() => handleToggle(room.id)}
              className="flex-row items-center gap-1.5 rounded-full border border-border/60 bg-surface px-3 py-2"
            >
              <Ionicons
                name={
                  (room.icon as keyof typeof Ionicons.glyphMap) ??
                  "home-outline"
                }
                size={14}
                color={accent}
              />
              <Text className="font-medium text-foreground text-sm">
                {room.name}
              </Text>
              <Ionicons name="close-circle" size={16} color={muted} />
            </PressableFeedback>
          ))}
          {liveRooms.data.length === 0 ? (
            <View className="rounded-2xl border border-border/60 border-dashed bg-surface px-4 py-3">
              <Text className="text-muted text-sm">
                Add at least one room to continue — type a name below and tap
                Add room.
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-2 rounded-2xl border border-border/40 bg-surface p-4">
          <TextField className="gap-1.5">
            <Label>
              <Label.Text>Add a custom room</Label.Text>
            </Label>
            <Input
              value={customRoom}
              onChangeText={setCustomRoom}
              onSubmitEditing={handleAdd}
              placeholder="Greenhouse, Patio, Studio…"
              autoCapitalize="words"
              returnKeyType="done"
            />
          </TextField>
          <PressableFeedback
            onPress={handleAdd}
            isDisabled={!customRoom.trim()}
            className="self-start"
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="add-circle-outline" size={18} color={accent} />
              <Text className="font-medium text-accent text-sm">Add room</Text>
            </View>
          </PressableFeedback>
        </View>

        <View className="flex-row items-center gap-2 rounded-2xl bg-accent-soft p-3">
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={accent}
          />
          <Text className="flex-1 text-accent-soft-foreground text-xs leading-4">
            Rooms make it easy to filter plants and remember where each one
            lives. We've started you off with five popular ones.
          </Text>
        </View>
      </View>
    </OnboardingShell>
  );
}
