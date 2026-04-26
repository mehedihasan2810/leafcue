import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="chevron-back" size={20} color={muted} />
        </Pressable>
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
