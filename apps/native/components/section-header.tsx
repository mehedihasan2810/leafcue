import { cn, PressableFeedback } from "heroui-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  count?: number;
  caption?: string;
  action?: ReactNode;
  onPressAction?: () => void;
  actionLabel?: string;
  className?: string;
};

export function SectionHeader({
  title,
  count,
  caption,
  action,
  onPressAction,
  actionLabel,
  className,
}: SectionHeaderProps) {
  return (
    <View
      className={cn("flex-row items-end justify-between gap-3 px-1", className)}
    >
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="font-semibold text-foreground text-lg">{title}</Text>
          {typeof count === "number" ? (
            <View className="rounded-full bg-muted/15 px-2 py-0.5">
              <Text className="font-medium text-muted text-xs">{count}</Text>
            </View>
          ) : null}
        </View>
        {caption ? <Text className="text-muted text-xs">{caption}</Text> : null}
      </View>
      {action ? (
        action
      ) : actionLabel ? (
        <PressableFeedback onPress={onPressAction}>
          <Text className="font-medium text-accent text-sm">{actionLabel}</Text>
        </PressableFeedback>
      ) : null}
    </View>
  );
}
