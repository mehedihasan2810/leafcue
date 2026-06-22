import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";

import { useCelebrationStore } from "@/stores/use-celebration-store";

/**
 * Root-mounted overlay that plays a brief, tasteful flourish whenever a care
 * task is completed (paired with a success haptic fired at the completion site).
 */
export function CompletionCelebration() {
  const nonce = useCelebrationStore((state) => state.nonce);
  const accentForeground = useThemeColor("accent-foreground");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (nonce === 0) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1100);
    return () => clearTimeout(timer);
  }, [nonce]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center"
    >
      <Animated.View
        key={nonce}
        entering={ZoomIn.springify().damping(12)}
        exiting={FadeOut.duration(220)}
        className="size-24 items-center justify-center rounded-full bg-accent shadow-lg"
      >
        <Ionicons name="checkmark" size={48} color={accentForeground} />
      </Animated.View>
    </View>
  );
}
