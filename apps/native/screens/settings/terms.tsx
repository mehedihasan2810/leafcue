import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { SettingsHeader } from "@/screens/settings/settings-header";

const POINTS: ReadonlyArray<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}> = [
  {
    icon: "leaf-outline",
    title: "LeafCue is free to use",
    body: "Core plant care — adding up to 20 active plants, unlimited archived plants, care tasks, schedules, reminders, logging, journal, photos, health, growth, rooms, and shelves — is free, with no account and no ads.",
  },
  {
    icon: "sparkles-outline",
    title: "LeafCue Plus is optional",
    body: "LeafCue Plus is an optional auto-renewing subscription that unlocks unlimited active plants and future power-user features. You can use LeafCue without it.",
  },
  {
    icon: "card-outline",
    title: "Billing and renewal",
    body: "Subscriptions are billed through your App Store or Google Play account and renew automatically unless canceled at least 24 hours before the end of the current period. Manage or cancel anytime in your store account settings.",
  },
  {
    icon: "phone-portrait-outline",
    title: "Your data stays on your device",
    body: "Purchases are processed by Apple, Google, and RevenueCat. LeafCue never sends your plant names, photos, logs, notes, or care data to any server.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Your data is never held hostage",
    body: "If LeafCue Plus expires, your existing plants and all their data remain fully visible, editable, and exportable. Only creating or reactivating active plants beyond the free limit requires Plus.",
  },
  {
    icon: "information-circle-outline",
    title: "Provided as is",
    body: "LeafCue is provided without warranties. To the extent permitted by law, the developer is not liable for any loss arising from use of the app.",
  },
];

export function TermsScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");

  return (
    <View className="flex-1 bg-background">
      <SettingsHeader title="Terms of Use" />
      <Container className="px-6" isScrollable>
        <View className="gap-3" style={{ paddingBottom: insets.bottom + 32 }}>
          <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-4">
            <Text className="font-semibold text-base text-foreground">
              Plain-language terms
            </Text>
            <Text className="text-muted text-xs">
              These terms describe how LeafCue and the optional LeafCue Plus
              subscription work. They are intentionally short and readable.
            </Text>
          </View>

          <View className="gap-2">
            {POINTS.map((point) => (
              <View
                key={point.title}
                className="flex-row items-start gap-3 rounded-3xl border border-border/40 bg-surface p-4"
              >
                <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
                  <Ionicons name={point.icon} size={18} color={accent} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-medium text-foreground text-sm">
                    {point.title}
                  </Text>
                  <Text className="text-muted text-xs">{point.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Container>
    </View>
  );
}
