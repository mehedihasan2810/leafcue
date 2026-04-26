import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import {
  BottomSheet,
  Button,
  FieldError,
  Input,
  Label,
  Spinner,
  TextArea,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";

import { formatIsoDate, parseIsoDate } from "@/lib/dates";
import type { GrowthMeasurement } from "@/lib/db/types";

export type MeasurementFormValues = {
  measuredAtIso: string;
  heightCm: string;
  leafCount: string;
  bloomCount: string;
  notes: string;
};

type MeasurementFormSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: GrowthMeasurement | null;
  onSubmit: (values: {
    heightCm: number | null;
    leafCount: number | null;
    bloomCount: number | null;
    notes: string | null;
    measuredAt: Date;
  }) => Promise<void> | void;
};

function buildInitial(
  initial: GrowthMeasurement | null | undefined,
): MeasurementFormValues {
  if (initial) {
    return {
      measuredAtIso: formatIsoDate(initial.measuredAt),
      heightCm: initial.heightCm !== null ? String(initial.heightCm) : "",
      leafCount: initial.leafCount !== null ? String(initial.leafCount) : "",
      bloomCount: initial.bloomCount !== null ? String(initial.bloomCount) : "",
      notes: initial.notes ?? "",
    };
  }
  return {
    measuredAtIso: formatIsoDate(new Date()),
    heightCm: "",
    leafCount: "",
    bloomCount: "",
    notes: "",
  };
}

export function MeasurementFormSheet({
  isOpen,
  onOpenChange,
  initial,
  onSubmit,
}: MeasurementFormSheetProps) {
  const accent = useThemeColor("accent");

  const defaults = useMemo(() => buildInitial(initial), [initial]);

  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      const measuredAt =
        value.measuredAtIso.trim().length > 0
          ? (parseIsoDate(value.measuredAtIso) ?? new Date())
          : new Date();
      const heightCm = parseNumber(value.heightCm);
      const leafCount = parseInteger(value.leafCount);
      const bloomCount = parseInteger(value.bloomCount);
      const notes = value.notes.trim() || null;

      if (
        heightCm === null &&
        leafCount === null &&
        bloomCount === null &&
        !notes
      ) {
        return;
      }

      await onSubmit({
        measuredAt,
        heightCm,
        leafCount,
        bloomCount,
        notes,
      });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaults);
    }
  }, [isOpen, defaults, form]);

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["75%", "92%"]}>
          <View className="gap-4">
            <View>
              <BottomSheet.Title className="text-foreground">
                {initial ? "Edit measurement" : "Log measurement"}
              </BottomSheet.Title>
              <BottomSheet.Description className="text-muted">
                Provide at least one value or a note.
              </BottomSheet.Description>
            </View>

            <form.Field name="measuredAtIso">
              {(field) => {
                const trimmed = field.state.value.trim();
                const invalid =
                  trimmed.length > 0 && parseIsoDate(trimmed) === null;
                return (
                  <TextField className="gap-1.5" isInvalid={invalid}>
                    <Label>
                      <Label.Text>Measured on</Label.Text>
                    </Label>
                    <Input
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      placeholder="YYYY-MM-DD"
                      keyboardType="numbers-and-punctuation"
                      autoCorrect={false}
                      maxLength={10}
                    />
                    {invalid ? (
                      <FieldError>Use the format YYYY-MM-DD.</FieldError>
                    ) : null}
                  </TextField>
                );
              }}
            </form.Field>

            <View className="flex-row gap-2">
              <form.Field name="heightCm">
                {(field) => (
                  <TextField className="flex-1 gap-1.5">
                    <Label>
                      <Label.Text>Height (cm)</Label.Text>
                    </Label>
                    <Input
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      placeholder="e.g. 18.5"
                      keyboardType="decimal-pad"
                      maxLength={6}
                    />
                  </TextField>
                )}
              </form.Field>
              <form.Field name="leafCount">
                {(field) => (
                  <TextField className="flex-1 gap-1.5">
                    <Label>
                      <Label.Text>Leaves</Label.Text>
                    </Label>
                    <Input
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      placeholder="e.g. 8"
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </TextField>
                )}
              </form.Field>
            </View>

            <form.Field name="bloomCount">
              {(field) => (
                <TextField className="gap-1.5">
                  <Label>
                    <Label.Text>Blooms</Label.Text>
                  </Label>
                  <Input
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder="e.g. 0"
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </TextField>
              )}
            </form.Field>

            <form.Field name="notes">
              {(field) => (
                <TextField className="gap-1.5">
                  <Label>
                    <Label.Text>Notes</Label.Text>
                  </Label>
                  <TextArea
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder="What's changed? Roots? New leaf?"
                    numberOfLines={3}
                  />
                </TextField>
              )}
            </form.Field>

            <View className="mt-1 flex-row gap-2">
              <Button
                variant="ghost"
                className="flex-1"
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
                {({ isSubmitting, canSubmit }) => (
                  <Button
                    className="flex-1"
                    isDisabled={!canSubmit || isSubmitting}
                    onPress={() => {
                      void form.handleSubmit();
                    }}
                  >
                    {isSubmitting ? (
                      <Spinner color="primary" />
                    ) : (
                      <>
                        <Ionicons name="add-outline" size={14} color={accent} />
                        <Button.Label>Save</Button.Label>
                      </>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </View>

            <Text className="text-center text-muted text-xs">
              Measurements stay on this device.
            </Text>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function parseInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num);
}
