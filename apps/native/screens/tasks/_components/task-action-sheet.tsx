import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";

import type { DueTaskRow } from "@/lib/db/repositories";

export type TaskActionType =
  | "snooze-1"
  | "snooze-3"
  | "snooze-custom"
  | "reschedule"
  | "skip"
  | "edit"
  | "disable"
  | "details";

type ActionItem = {
  id: TaskActionType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
  destructive?: boolean;
};

const ACTIONS: ReadonlyArray<ActionItem> = [
  {
    id: "details",
    label: "Add details",
    icon: "create-outline",
    description: "Notes, amount, mood, photo",
  },
  {
    id: "snooze-1",
    label: "Snooze 1 day",
    icon: "time-outline",
  },
  {
    id: "snooze-3",
    label: "Snooze 3 days",
    icon: "time-outline",
  },
  {
    id: "snooze-custom",
    label: "Snooze until…",
    icon: "calendar-outline",
  },
  {
    id: "reschedule",
    label: "Reschedule",
    icon: "swap-horizontal-outline",
    description: "Pick a new due date",
  },
  {
    id: "skip",
    label: "Skip once",
    icon: "play-skip-forward-outline",
    description: "Move to next interval, no log",
  },
  {
    id: "edit",
    label: "Edit schedule",
    icon: "options-outline",
  },
  {
    id: "disable",
    label: "Disable schedule",
    icon: "pause-circle-outline",
    destructive: true,
  },
];

type TaskActionSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  row: DueTaskRow | null;
  onAction: (row: DueTaskRow, action: TaskActionType) => void;
};

export function TaskActionSheet({
  isOpen,
  onOpenChange,
  row,
  onAction,
}: TaskActionSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <View className="gap-1">
            <BottomSheet.Title className="text-foreground">
              {row?.schedule.customName ??
                row?.template?.name ??
                "Task actions"}
            </BottomSheet.Title>
            {row ? (
              <BottomSheet.Description className="text-muted">
                For {row.plant.nickname}
              </BottomSheet.Description>
            ) : null}

            <View className="mt-4 gap-1">
              {ACTIONS.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  onPress={() => {
                    if (!row) return;
                    onAction(row, action.id);
                  }}
                />
              ))}
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function ActionRow({
  action,
  onPress,
}: {
  action: ActionItem;
  onPress: () => void;
}) {
  const accent = useThemeColor("accent");
  const danger = useThemeColor("danger");
  const muted = useThemeColor("muted");
  const tint = action.destructive ? danger : accent;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-3 py-3 active:bg-muted/10"
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <View className="size-9 items-center justify-center rounded-xl bg-accent-soft">
        <Ionicons name={action.icon} size={18} color={tint} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text
          className="font-medium text-foreground text-sm"
          style={action.destructive ? { color: tint } : undefined}
        >
          {action.label}
        </Text>
        {action.description ? (
          <Text className="text-muted text-xs" style={{ color: muted }}>
            {action.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={muted} />
    </Pressable>
  );
}
