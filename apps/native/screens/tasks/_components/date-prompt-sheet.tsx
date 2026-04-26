import { Ionicons } from "@expo/vector-icons";
import { addDays } from "date-fns";
import {
  BottomSheet,
  Button,
  Chip,
  FieldError,
  Input,
  Label,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { formatIsoDate, parseIsoDate } from "@/lib/dates";

type DatePromptSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialDate?: Date | null;
  minDate?: Date;
  submitLabel?: string;
  onSubmit: (date: Date) => void;
};

const QUICK_DAYS: ReadonlyArray<{ label: string; days: number }> = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
  { label: "In 14 days", days: 14 },
];

export function DatePromptSheet({
  isOpen,
  onOpenChange,
  title,
  description,
  initialDate,
  minDate,
  submitLabel = "Set date",
  onSubmit,
}: DatePromptSheetProps) {
  const accent = useThemeColor("accent");
  const [value, setValue] = useState<string>(() =>
    formatIsoDate(initialDate ?? new Date()),
  );

  useEffect(() => {
    if (isOpen) {
      setValue(formatIsoDate(initialDate ?? new Date()));
    }
  }, [isOpen, initialDate]);

  const parsed = parseIsoDate(value);
  const tooEarly =
    parsed && minDate ? parsed.getTime() < minDate.getTime() : false;
  const isValid = parsed !== null && !tooEarly;

  const errorMessage = !value
    ? undefined
    : parsed === null
      ? "Use the format YYYY-MM-DD."
      : tooEarly
        ? "Choose a date in the future."
        : undefined;

  const handleQuick = (days: number) => {
    const next = addDays(new Date(), days);
    setValue(formatIsoDate(next));
  };

  const handleSubmit = () => {
    if (!parsed || tooEarly) return;
    onSubmit(parsed);
    onOpenChange(false);
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <View className="gap-3">
            <BottomSheet.Title className="text-foreground">
              {title}
            </BottomSheet.Title>
            {description ? (
              <BottomSheet.Description className="text-muted">
                {description}
              </BottomSheet.Description>
            ) : null}

            <View className="mt-2 flex-row flex-wrap gap-2">
              {QUICK_DAYS.map((option) => (
                <Chip
                  key={option.label}
                  variant="secondary"
                  size="sm"
                  color="default"
                  onPress={() => handleQuick(option.days)}
                >
                  <Ionicons name="time-outline" size={12} color={accent} />
                  <Chip.Label>{option.label}</Chip.Label>
                </Chip>
              ))}
            </View>

            <TextField
              isInvalid={Boolean(errorMessage)}
              className="mt-1 gap-1.5"
            >
              <Label>
                <Label.Text>Date (YYYY-MM-DD)</Label.Text>
              </Label>
              <Input
                value={value}
                onChangeText={setValue}
                placeholder="2026-05-04"
                keyboardType="numbers-and-punctuation"
                autoCorrect={false}
                maxLength={10}
              />
              {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
            </TextField>

            <View className="mt-1 flex-row gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onPress={() => onOpenChange(false)}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                className="flex-1"
                isDisabled={!isValid}
                onPress={handleSubmit}
              >
                <Button.Label>{submitLabel}</Button.Label>
              </Button>
            </View>
            <Text className="text-center text-muted text-xs">
              Stays on this device.
            </Text>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
