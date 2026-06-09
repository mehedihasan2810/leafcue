import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PressableFeedback, useThemeColor } from "heroui-native";

export function SettingsButton() {
  const muted = useThemeColor("muted");

  return (
    <PressableFeedback
      onPress={() => router.push("/settings")}
      className="size-10 items-center justify-center rounded-full bg-surface"
      accessibilityLabel="Settings"
    >
      <Ionicons name="settings-outline" size={18} color={muted} />
    </PressableFeedback>
  );
}
