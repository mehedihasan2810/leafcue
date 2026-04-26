import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import {
  BottomSheet,
  Button,
  Chip,
  Input,
  Label,
  Spinner,
  TextArea,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { z } from "zod";

import { PhotoPickerField } from "@/components/photo-picker-field";
import type { CompleteTaskInput, DueTaskRow } from "@/lib/db/repositories";

export const completeTaskFormSchema = z.object({
  notes: z.string().max(2000).optional(),
  amount: z.string().optional(),
  unit: z.string().max(20).optional(),
  mood: z.string().max(40).nullable().optional(),
  photoUri: z.string().nullable().optional(),
});

export type CompleteTaskFormValues = z.infer<typeof completeTaskFormSchema>;

const MEASURABLE_TEMPLATE_KEYS = new Set(["water", "fertilize", "mist"]);

const DEFAULT_UNIT_BY_KEY: Record<string, string> = {
  water: "ml",
  fertilize: "ml",
  mist: "spray",
};

const MOOD_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
}> = [
  { value: "thriving", label: "Thriving", icon: "happy-outline" },
  { value: "ok", label: "Doing okay", icon: "leaf-outline" },
  { value: "stressed", label: "Stressed", icon: "alert-circle-outline" },
  { value: "recovering", label: "Recovering", icon: "medkit-outline" },
];

type QuickCompleteSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  row: DueTaskRow | null;
  onSubmit: (input: CompleteTaskInput) => Promise<void> | void;
  isSubmitting?: boolean;
};

function buildDefaults(row: DueTaskRow | null): CompleteTaskFormValues {
  const templateKey = row?.template?.key ?? "";
  const unit = DEFAULT_UNIT_BY_KEY[templateKey] ?? "";
  return {
    notes: "",
    amount: "",
    unit,
    mood: null,
    photoUri: null,
  };
}

export function QuickCompleteSheet({
  isOpen,
  onOpenChange,
  row,
  onSubmit,
  isSubmitting,
}: QuickCompleteSheetProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  const defaults = useMemo(() => buildDefaults(row), [row]);
  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      if (!row) return;
      const numericAmount = value.amount?.trim()
        ? Number(value.amount.trim())
        : null;
      const trimmedUnit = value.unit?.trim() || null;
      const trimmedNotes = value.notes?.trim() || null;
      const finalAmount =
        numericAmount !== null && Number.isFinite(numericAmount)
          ? numericAmount
          : null;

      await onSubmit({
        scheduleId: row.schedule.id,
        notes: trimmedNotes,
        amount: finalAmount,
        unit: trimmedUnit,
        mood: value.mood ?? null,
        photoUri: value.photoUri ?? null,
      });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaults);
    }
  }, [isOpen, defaults, form]);

  const templateKey = row?.template?.key ?? "";
  const showAmount = MEASURABLE_TEMPLATE_KEYS.has(templateKey);
  const taskName = row?.schedule.customName ?? row?.template?.name ?? "Care";

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["75%", "90%"]}>
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <View className="size-9 items-center justify-center rounded-xl bg-accent-soft">
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color={accent}
                />
              </View>
              <View className="flex-1">
                <BottomSheet.Title className="text-foreground">
                  Log {taskName.toLowerCase()}
                </BottomSheet.Title>
                {row ? (
                  <BottomSheet.Description className="text-muted">
                    {row.plant.nickname}
                  </BottomSheet.Description>
                ) : null}
              </View>
            </View>

            {showAmount ? (
              <View className="flex-row gap-2">
                <form.Field name="amount">
                  {(field) => (
                    <TextField className="flex-1 gap-1.5">
                      <Label>
                        <Label.Text>Amount</Label.Text>
                      </Label>
                      <Input
                        value={field.state.value ?? ""}
                        onChangeText={field.handleChange}
                        placeholder="e.g. 250"
                        keyboardType="decimal-pad"
                      />
                    </TextField>
                  )}
                </form.Field>
                <form.Field name="unit">
                  {(field) => (
                    <TextField className="w-28 gap-1.5">
                      <Label>
                        <Label.Text>Unit</Label.Text>
                      </Label>
                      <Input
                        value={field.state.value ?? ""}
                        onChangeText={field.handleChange}
                        placeholder="ml"
                        autoCapitalize="none"
                        maxLength={20}
                      />
                    </TextField>
                  )}
                </form.Field>
              </View>
            ) : null}

            <form.Field name="mood">
              {(field) => (
                <View className="gap-1.5">
                  <Label>
                    <Label.Text>How does it look?</Label.Text>
                  </Label>
                  <View className="flex-row flex-wrap gap-2">
                    {MOOD_OPTIONS.map((option) => {
                      const isSelected = field.state.value === option.value;
                      return (
                        <Chip
                          key={option.value}
                          variant={isSelected ? "primary" : "secondary"}
                          color={isSelected ? "accent" : "default"}
                          size="sm"
                          onPress={() =>
                            field.handleChange(isSelected ? null : option.value)
                          }
                        >
                          <Ionicons
                            name={option.icon}
                            size={12}
                            color={isSelected ? accent : muted}
                          />
                          <Chip.Label>{option.label}</Chip.Label>
                        </Chip>
                      );
                    })}
                  </View>
                </View>
              )}
            </form.Field>

            <form.Field name="notes">
              {(field) => (
                <TextField className="gap-1.5">
                  <Label>
                    <Label.Text>Notes</Label.Text>
                  </Label>
                  <TextArea
                    value={field.state.value ?? ""}
                    onChangeText={field.handleChange}
                    placeholder="Anything to remember about today's care?"
                    numberOfLines={3}
                  />
                </TextField>
              )}
            </form.Field>

            <form.Field name="photoUri">
              {(field) => (
                <View className="gap-1.5">
                  <Label>
                    <Label.Text>Photo</Label.Text>
                  </Label>
                  <PhotoPickerField
                    value={field.state.value ?? null}
                    onChange={(uri) => field.handleChange(uri)}
                    description="Photos stay on this device."
                    size={96}
                  />
                </View>
              )}
            </form.Field>

            <View className="mt-2 flex-row gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                isDisabled={isSubmitting}
                onPress={() => onOpenChange(false)}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <form.Subscribe
                selector={(state) => ({
                  isSubmitting: state.isSubmitting,
                  canSubmit: state.canSubmit,
                })}
              >
                {({ isSubmitting: pending, canSubmit }) => (
                  <Button
                    className="flex-1"
                    isDisabled={!canSubmit || pending || isSubmitting}
                    onPress={() => {
                      void form.handleSubmit();
                    }}
                  >
                    {pending || isSubmitting ? (
                      <Spinner color="primary" />
                    ) : (
                      <Button.Label>Mark complete</Button.Label>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </View>
            <Text className="text-center text-muted text-xs">
              All details stay on this device.
            </Text>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
