import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { SettingsHeader } from "@/screens/settings/settings-header";

export function AboutScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View className="flex-1 bg-background">
      <SettingsHeader title="About LeafCue" />
      <Container className="px-6" isScrollable>
        <View className="gap-6" style={{ paddingBottom: insets.bottom + 32 }}>
          <View className="items-center gap-3 rounded-3xl border border-border/40 bg-surface p-6">
            <View className="size-16 items-center justify-center rounded-3xl bg-accent-soft">
              <Ionicons name="leaf" size={32} color={accent} />
            </View>
            <Text className="font-semibold text-foreground text-lg">
              LeafCue
            </Text>
            <Text className="text-center text-muted text-xs">
              A private, offline plant care tracker for watering, fertilizing,
              reminders, photos, journals, growth logs, and plant health notes.
              No account required.
            </Text>
            <Text className="text-muted text-xs">Version {appVersion}</Text>
          </View>

          <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-4">
            <Text className="font-medium text-foreground text-sm">
              How it works
            </Text>
            <Text className="text-muted text-xs">
              Everything lives on your device. No accounts, no servers, no
              tracking. Reminders are local notifications scheduled by your
              phone. Backups are JSON files you control.
            </Text>
          </View>
        </View>
      </Container>
    </View>
  );
}
