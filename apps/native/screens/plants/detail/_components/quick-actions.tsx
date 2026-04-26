import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { FlatList, Pressable, Text, View } from "react-native";

export type QuickActionId =
  | "water"
  | "fertilize"
  | "photo"
  | "journal"
  | "health"
  | "growth"
  | "edit";

export type QuickAction = {
  id: QuickActionId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
};

type QuickActionsProps = {
  actions: ReadonlyArray<QuickAction>;
  onPress: (id: QuickActionId) => void;
};

export function QuickActions({ actions, onPress }: QuickActionsProps) {
  return (
    <FlatList
      horizontal
      data={actions}
      keyExtractor={(item) => `qa-${item.id}`}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      renderItem={({ item }) => (
        <QuickActionPill action={item} onPress={onPress} />
      )}
    />
  );
}

function QuickActionPill({
  action,
  onPress,
}: {
  action: QuickAction;
  onPress: (id: QuickActionId) => void;
}) {
  const accent = useThemeColor("accent");

  return (
    <Pressable
      onPress={() => onPress(action.id)}
      disabled={action.disabled}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      className="flex-row items-center gap-1.5 rounded-full border border-border/60 bg-surface px-3 py-2"
      style={{ opacity: action.disabled ? 0.5 : 1 }}
    >
      <View className="size-7 items-center justify-center rounded-full bg-accent-soft">
        <Ionicons name={action.icon} size={14} color={accent} />
      </View>
      <Text className="font-medium text-foreground text-sm">
        {action.label}
      </Text>
    </Pressable>
  );
}
