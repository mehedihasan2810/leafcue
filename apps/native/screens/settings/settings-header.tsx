import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SettingsHeaderProps = {
  title: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
};

export function SettingsHeader({
  title,
  showBack = true,
  rightSlot,
}: SettingsHeaderProps) {
  const insets = useSafeAreaInsets();
  const muted = useThemeColor("muted");

  return (
    <View
      className="flex-row items-center justify-between px-6"
      style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
    >
      {showBack ? (
        <PressableFeedback
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="chevron-back" size={20} color={muted} />
        </PressableFeedback>
      ) : (
        <View className="w-9" />
      )}
      <Text
        accessibilityRole="header"
        className="font-semibold text-base text-foreground"
      >
        {title}
      </Text>
      <View className="w-9 items-end">{rightSlot}</View>
    </View>
  );
}
