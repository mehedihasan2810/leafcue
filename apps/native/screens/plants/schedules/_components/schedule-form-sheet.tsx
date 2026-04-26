import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import {
  BottomSheet,
  Button,
  Chip,
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

import { getCareTaskIcon } from "@/components/care-task-icons";
import { formatIsoDate, parseIsoDate } from "@/lib/dates";
import type { CareTaskTemplate, PlantTaskSchedule } from "@/lib/db/types";

export type ScheduleFormValues = {
  templateId: number | null;
  customName: string;
  intervalDays: string;
  nextDueAtIso: string;
  preferredHour: string;
  preferredMinute: string;
  instructions: string;
};

type ScheduleFormSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ReadonlyArray<CareTaskTemplate>;
  initial?: PlantTaskSchedule | null;
  onSubmit: (values: {
    templateId: number | null;
    customName: string | null;
    intervalDays: number | null;
    nextDueAt: Date | null;
    preferredHour: number | null;
    preferredMinute: number | null;
    instructions: string | null;
  }) => Promise<void> | void;
  onDelete?: () => void;
};

function buildInitial(
  initial: PlantTaskSchedule | null | undefined,
  templates: ReadonlyArray<CareTaskTemplate>,
): ScheduleFormValues {
  if (initial) {
    return {
      templateId: initial.templateId ?? null,
      customName: initial.customName ?? "",
      intervalDays:
        initial.intervalDays !== null ? String(initial.intervalDays) : "",
      nextDueAtIso: formatIsoDate(initial.nextDueAt ?? null),
      preferredHour:
        initial.preferredHour !== null ? String(initial.preferredHour) : "",
      preferredMinute:
        initial.preferredMinute !== null ? String(initial.preferredMinute) : "",
      instructions: initial.instructions ?? "",
    };
  }
  const defaultTemplate = templates.find((t) => t.key === "water") ?? null;
  return {
    templateId: defaultTemplate?.id ?? null,
    customName: "",
    intervalDays:
      defaultTemplate?.defaultIntervalDays !== null &&
      defaultTemplate?.defaultIntervalDays !== undefined
        ? String(defaultTemplate.defaultIntervalDays)
        : "",
    nextDueAtIso: "",
    preferredHour: "",
    preferredMinute: "",
    instructions: defaultTemplate?.defaultInstructions ?? "",
  };
}

export function ScheduleFormSheet({
  isOpen,
  onOpenChange,
  templates,
  initial,
  onSubmit,
  onDelete,
}: ScheduleFormSheetProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const danger = useThemeColor("danger");

  const defaults = useMemo(
    () => buildInitial(initial, templates),
    [initial, templates],
  );

  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      const interval = value.intervalDays.trim()
        ? Number(value.intervalDays.trim())
        : null;
      const nextDueAt = value.nextDueAtIso.trim()
        ? parseIsoDate(value.nextDueAtIso.trim())
        : null;
      const preferredHour = value.preferredHour.trim()
        ? Number(value.preferredHour.trim())
        : null;
      const preferredMinute = value.preferredMinute.trim()
        ? Number(value.preferredMinute.trim())
        : null;

      await onSubmit({
        templateId: value.templateId,
        customName: value.customName.trim() || null,
        intervalDays:
          interval !== null && Number.isFinite(interval) && interval > 0
            ? interval
            : null,
        nextDueAt,
        preferredHour:
          preferredHour !== null &&
          Number.isFinite(preferredHour) &&
          preferredHour >= 0 &&
          preferredHour <= 23
            ? preferredHour
            : null,
        preferredMinute:
          preferredMinute !== null &&
          Number.isFinite(preferredMinute) &&
          preferredMinute >= 0 &&
          preferredMinute <= 59
            ? preferredMinute
            : null,
        instructions: value.instructions.trim() || null,
      });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaults);
    }
  }, [isOpen, defaults, form]);

  const isEdit = Boolean(initial);

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["75%", "92%"]}>
          <View className="gap-4">
            <View>
              <BottomSheet.Title className="text-foreground">
                {isEdit ? "Edit schedule" : "Add care schedule"}
              </BottomSheet.Title>
              <BottomSheet.Description className="text-muted">
                Use plant defaults or set your own cadence.
              </BottomSheet.Description>
            </View>

            <form.Field name="templateId">
              {(field) => (
                <View className="gap-2">
                  <Label>
                    <Label.Text>Task type</Label.Text>
                  </Label>
                  <View className="flex-row flex-wrap gap-2">
                    {templates.map((template) => {
                      const isSelected = field.state.value === template.id;
                      return (
                        <Chip
                          key={template.id}
                          variant={isSelected ? "primary" : "secondary"}
                          color={isSelected ? "accent" : "default"}
                          size="sm"
                          onPress={() => {
                            field.handleChange(template.id);
                            if (!form.state.values.intervalDays.trim()) {
                              form.setFieldValue(
                                "intervalDays",
                                template.defaultIntervalDays !== null
                                  ? String(template.defaultIntervalDays)
                                  : "",
                              );
                            }
                            if (!form.state.values.instructions.trim()) {
                              form.setFieldValue(
                                "instructions",
                                template.defaultInstructions ?? "",
                              );
                            }
                          }}
                        >
                          <Ionicons
                            name={getCareTaskIcon(template.key)}
                            size={12}
                            color={isSelected ? accent : muted}
                          />
                          <Chip.Label>{template.name}</Chip.Label>
                        </Chip>
                      );
                    })}
                  </View>
                </View>
              )}
            </form.Field>

            <form.Field name="customName">
              {(field) => (
                <TextField className="gap-1.5">
                  <Label>
                    <Label.Text>Custom name</Label.Text>
                  </Label>
                  <Input
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder="Optional override"
                    maxLength={80}
                  />
                </TextField>
              )}
            </form.Field>

            <View className="flex-row gap-2">
              <form.Field name="intervalDays">
                {(field) => (
                  <TextField className="flex-1 gap-1.5">
                    <Label>
                      <Label.Text>Every (days)</Label.Text>
                    </Label>
                    <Input
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      placeholder="e.g. 7"
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </TextField>
                )}
              </form.Field>
              <form.Field name="nextDueAtIso">
                {(field) => {
                  const trimmed = field.state.value.trim();
                  const isInvalid =
                    trimmed.length > 0 && parseIsoDate(trimmed) === null;
                  return (
                    <TextField className="flex-1 gap-1.5" isInvalid={isInvalid}>
                      <Label>
                        <Label.Text>Next due</Label.Text>
                      </Label>
                      <Input
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        placeholder="YYYY-MM-DD"
                        keyboardType="numbers-and-punctuation"
                        autoCorrect={false}
                        maxLength={10}
                      />
                      {isInvalid ? (
                        <FieldError>Use the format YYYY-MM-DD.</FieldError>
                      ) : null}
                    </TextField>
                  );
                }}
              </form.Field>
            </View>

            <View className="flex-row gap-2">
              <form.Field name="preferredHour">
                {(field) => (
                  <TextField className="flex-1 gap-1.5">
                    <Label>
                      <Label.Text>Reminder hour (0–23)</Label.Text>
                    </Label>
                    <Input
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      placeholder="App default"
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </TextField>
                )}
              </form.Field>
              <form.Field name="preferredMinute">
                {(field) => (
                  <TextField className="flex-1 gap-1.5">
                    <Label>
                      <Label.Text>Minute (0–59)</Label.Text>
                    </Label>
                    <Input
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      placeholder="App default"
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </TextField>
                )}
              </form.Field>
            </View>

            <form.Field name="instructions">
              {(field) => (
                <TextField className="gap-1.5">
                  <Label>
                    <Label.Text>Instructions</Label.Text>
                  </Label>
                  <TextArea
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder="What's the routine? Any tips?"
                    numberOfLines={3}
                  />
                </TextField>
              )}
            </form.Field>

            <View className="mt-1 flex-row gap-2">
              {isEdit && onDelete ? (
                <Button variant="ghost" onPress={onDelete}>
                  <Ionicons name="trash-outline" size={14} color={danger} />
                  <Button.Label style={{ color: danger }}>Delete</Button.Label>
                </Button>
              ) : null}
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
                      <Button.Label>
                        {isEdit ? "Save schedule" : "Add schedule"}
                      </Button.Label>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </View>
            <Text className="text-center text-muted text-xs">
              Schedules stay on this device.
            </Text>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
