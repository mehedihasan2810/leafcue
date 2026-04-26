import { Ionicons } from "@expo/vector-icons";
import { Button, useThemeColor } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

export type UndoToastProps = {
  isVisible: boolean;
  message: string;
  durationMs?: number;
  onUndo: () => void;
  onDismiss: () => void;
};

export function UndoToast({
  isVisible,
  message,
  durationMs = 4000,
  onUndo,
  onDismiss,
}: UndoToastProps) {
  const accent = useThemeColor("accent");
  const success = useThemeColor("success");
  const [progress, setProgress] = useState(1);
  const startedAt = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) {
      startedAt.current = null;
      setProgress(1);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      return;
    }

    startedAt.current = Date.now();

    const tick = () => {
      if (startedAt.current === null) return;
      const elapsed = Date.now() - startedAt.current;
      const ratio = Math.max(0, 1 - elapsed / durationMs);
      setProgress(ratio);
      if (ratio <= 0) {
        onDismiss();
        return;
      }
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [isVisible, durationMs, onDismiss]);

  if (!isVisible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(150)}
      className="overflow-hidden rounded-2xl border border-border/40 bg-surface shadow-md"
    >
      <View className="flex-row items-center gap-3 p-3">
        <View className="size-9 items-center justify-center rounded-xl bg-success-soft">
          <Ionicons name="checkmark-circle" size={20} color={success} />
        </View>
        <Text className="flex-1 font-medium text-foreground text-sm">
          {message}
        </Text>
        <Button size="sm" variant="ghost" onPress={onUndo}>
          <Ionicons name="arrow-undo" size={14} color={accent} />
          <Button.Label>Undo</Button.Label>
        </Button>
      </View>
      <View className="h-1 w-full bg-border/30">
        <View
          className="h-full bg-accent"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>
    </Animated.View>
  );
}
