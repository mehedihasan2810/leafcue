import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, Button, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { buildCareCueExplanation } from "@/lib/care/cue-explanations";
import type { DueTaskRow } from "@/lib/db/repositories";

type WhyThisCueSheetProps = {
  row: DueTaskRow | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEditSchedule: () => void;
};

export function WhyThisCueSheet({
  row,
  isOpen,
  onOpenChange,
  onEditSchedule,
}: WhyThisCueSheetProps) {
  const accent = useThemeColor("accent");
  const explanation = row ? buildCareCueExplanation(row) : null;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <View className="gap-4">
            <View className="gap-1">
              <BottomSheet.Title className="text-foreground">
                Why this cue?
              </BottomSheet.Title>
              {explanation ? (
                <BottomSheet.Description className="text-muted">
                  {explanation.title}
                </BottomSheet.Description>
              ) : null}
            </View>

            {explanation ? (
              <View className="gap-3">
                <View className="rounded-2xl bg-accent-soft/40 p-3">
                  <Text className="text-foreground text-sm leading-5">
                    {explanation.reason}
                  </Text>
                </View>
                <View className="gap-2">
                  {explanation.details.map((detail) => (
                    <View
                      key={detail}
                      className="flex-row items-start gap-2 rounded-2xl bg-surface-secondary p-3"
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={15}
                        color={accent}
                      />
                      <Text className="flex-1 text-foreground text-xs leading-4">
                        {detail}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View className="flex-row gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onPress={() => onOpenChange(false)}
              >
                <Button.Label>Close</Button.Label>
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onPress={() => {
                  onOpenChange(false);
                  onEditSchedule();
                }}
              >
                <Button.Label>Edit schedule</Button.Label>
              </Button>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
