import { cn } from "heroui-native";
import type { PropsWithChildren, ReactNode } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type KeyboardAwareScreenProps = PropsWithChildren<{
  className?: string;
  contentClassName?: string;
  footer?: ReactNode;
  bottomOffset?: number;
}>;

export function KeyboardAwareScreen({
  className,
  contentClassName,
  footer,
  bottomOffset = 24,
  children,
}: KeyboardAwareScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className={cn("flex-1 bg-background", className)}>
      <KeyboardAwareScrollView
        bottomOffset={bottomOffset}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 12,
          paddingBottom: footer ? 16 : insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className={cn("flex-1 gap-4 px-6", contentClassName)}>
          {children}
        </View>
      </KeyboardAwareScrollView>

      {footer ? (
        <View
          className="border-border/40 border-t bg-background/95 px-6 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}
