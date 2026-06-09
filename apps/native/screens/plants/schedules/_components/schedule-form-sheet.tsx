import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useForm } from "@tanstack/react-form";
import { addDays, format } from "date-fns";
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
import { z } from "zod";

import { getCareTaskIcon } from "@/components/care-task-icons";
import { formatIsoDate, parseIsoDate, relativeDueLabel } from "@/lib/dates";
import type { CareTaskTemplate, PlantTaskSchedule } from "@/lib/db/types";
import {
  applyCareStyleInterval,
  type CareStyle,
  careStyleOptions,
} from "@/screens/plants/edit/care-style";

export type ScheduleFormValues = {
  templateId: number | null;
  careStyle: CareStyle;
  customName: string;
  intervalDays: string;
  nextDueAtIso: string;
  preferredHour: string;
  preferredMinute: string;
  instructions: string;
};

const optionalPositiveIntTextSchema = z.string().refine((value) => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 365;
}, "Use a whole number from 1 to 365.");

const optionalHourTextSchema = z.string().refine((value) => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 23;
}, "Hour must be 0-23.");

const optionalMinuteTextSchema = z.string().refine((value) => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 59;
}, "Minute must be 0-59.");

const optionalIsoDateTextSchema = z.string().refine((value) => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return parseIsoDate(trimmed) !== null;
}, "Use the format YYYY-MM-DD.");

const scheduleFormSchema = z.object({
  templateId: z.number().int().positive().nullable(),
  careStyle: z.enum(["ease", "balanced", "growth"]),
  customName: z.string().max(80),
  intervalDays: optionalPositiveIntTextSchema,
  nextDueAtIso: optionalIsoDateTextSchema,
  preferredHour: optionalHourTextSchema,
  preferredMinute: optionalMinuteTextSchema,
  instructions: z.string().max(2000),
});

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
      careStyle: "balanced",
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
    careStyle: "balanced",
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

function parseOptionalInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : null;
}

function selectedTemplate(
  templates: ReadonlyArray<CareTaskTemplate>,
  templateId: number | null,
): CareTaskTemplate | null {
  if (templateId === null) return null;
  return templates.find((template) => template.id === templateId) ?? null;
}

function resolvePreviewInterval(
  values: ScheduleFormValues,
  template: CareTaskTemplate | null,
): number | null {
  return (
    parseOptionalInteger(values.intervalDays) ??
    applyCareStyleInterval(
      template?.defaultIntervalDays ?? null,
      values.careStyle,
    )
  );
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
      const parsed = scheduleFormSchema.safeParse(value);
      if (!parsed.success) return;

      const template = selectedTemplate(templates, parsed.data.templateId);
      const interval = resolvePreviewInterval(parsed.data, template);
      const nextDueAt = parsed.data.nextDueAtIso.trim()
        ? parseIsoDate(parsed.data.nextDueAtIso.trim())
        : interval
          ? addDays(new Date(), interval)
          : null;
      const preferredHour = parseOptionalInteger(parsed.data.preferredHour);
      const preferredMinute = parseOptionalInteger(parsed.data.preferredMinute);

      await onSubmit({
        templateId: parsed.data.templateId,
        customName: parsed.data.customName.trim() || null,
        intervalDays: interval,
        nextDueAt,
        preferredHour,
        preferredMinute,
        instructions: parsed.data.instructions.trim() || null,
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
        <BottomSheet.Content
          snapPoints={["75%", "92%"]}
          enableOverDrag={false}
          enableDynamicSizing={false}
          contentContainerClassName="h-full"
          keyboardBehavior="extend"
        >
          <BottomSheetScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
          >
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
                              const interval = applyCareStyleInterval(
                                template.defaultIntervalDays,
                                form.state.values.careStyle,
                              );
                              form.setFieldValue(
                                "intervalDays",
                                interval !== null ? String(interval) : "",
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

            <form.Field name="careStyle">
              {(field) => (
                <View className="gap-2">
                  <Label>
                    <Label.Text>Care style</Label.Text>
                  </Label>
                  <View className="flex-row flex-wrap gap-2">
                    {careStyleOptions.map((option) => {
                      const isSelected = field.state.value === option.value;
                      return (
                        <Chip
                          key={option.value}
                          variant={isSelected ? "primary" : "secondary"}
                          color={isSelected ? "accent" : "default"}
                          size="sm"
                          onPress={() => {
                            field.handleChange(option.value);
                            const template = selectedTemplate(
                              templates,
                              form.state.values.templateId,
                            );
                            if (template) {
                              const interval = applyCareStyleInterval(
                                template.defaultIntervalDays,
                                option.value,
                              );
                              if (interval !== null) {
                                form.setFieldValue(
                                  "intervalDays",
                                  String(interval),
                                );
                              }
                            }
                          }}
                        >
                          <Chip.Label>{option.label}</Chip.Label>
                        </Chip>
                      );
                    })}
                  </View>
                  <Text className="text-muted text-xs">
                    {careStyleOptions.find(
                      (option) => option.value === field.state.value,
                    )?.description ?? "Recommended default."}
                  </Text>
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
              <form.Field
                name="intervalDays"
                validators={{
                  onChange: ({ value }) => {
                    const result =
                      optionalPositiveIntTextSchema.safeParse(value);
                    return result.success
                      ? undefined
                      : (result.error.issues[0]?.message ??
                          "Use a whole number from 1 to 365.");
                  },
                }}
              >
                {(field) => (
                  <TextField
                    className="flex-1 gap-1.5"
                    isInvalid={field.state.meta.errors.length > 0}
                  >
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
                    {field.state.meta.errors[0] ? (
                      <FieldError>{field.state.meta.errors[0]}</FieldError>
                    ) : null}
                  </TextField>
                )}
              </form.Field>
              <form.Field
                name="nextDueAtIso"
                validators={{
                  onChange: ({ value }) => {
                    const result = optionalIsoDateTextSchema.safeParse(value);
                    return result.success
                      ? undefined
                      : (result.error.issues[0]?.message ??
                          "Use the format YYYY-MM-DD.");
                  },
                }}
              >
                {(field) => {
                  const isInvalid = field.state.meta.errors.length > 0;
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
                        <FieldError>{field.state.meta.errors[0]}</FieldError>
                      ) : null}
                    </TextField>
                  );
                }}
              </form.Field>
            </View>

            <View className="flex-row gap-2">
              <form.Field
                name="preferredHour"
                validators={{
                  onChange: ({ value }) => {
                    const result = optionalHourTextSchema.safeParse(value);
                    return result.success
                      ? undefined
                      : (result.error.issues[0]?.message ??
                          "Hour must be 0-23.");
                  },
                }}
              >
                {(field) => (
                  <TextField
                    className="flex-1 gap-1.5"
                    isInvalid={field.state.meta.errors.length > 0}
                  >
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
                    {field.state.meta.errors[0] ? (
                      <FieldError>{field.state.meta.errors[0]}</FieldError>
                    ) : null}
                  </TextField>
                )}
              </form.Field>
              <form.Field
                name="preferredMinute"
                validators={{
                  onChange: ({ value }) => {
                    const result = optionalMinuteTextSchema.safeParse(value);
                    return result.success
                      ? undefined
                      : (result.error.issues[0]?.message ??
                          "Minute must be 0-59.");
                  },
                }}
              >
                {(field) => (
                  <TextField
                    className="flex-1 gap-1.5"
                    isInvalid={field.state.meta.errors.length > 0}
                  >
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
                    {field.state.meta.errors[0] ? (
                      <FieldError>{field.state.meta.errors[0]}</FieldError>
                    ) : null}
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

            <form.Subscribe selector={(state) => state.values}>
              {(values) => {
                const template = selectedTemplate(templates, values.templateId);
                const interval = resolvePreviewInterval(values, template);
                const nextDue = values.nextDueAtIso.trim()
                  ? parseIsoDate(values.nextDueAtIso)
                  : interval
                    ? addDays(new Date(), interval)
                    : null;
                const reminder =
                  values.preferredHour.trim() && values.preferredMinute.trim()
                    ? `${values.preferredHour.padStart(
                        2,
                        "0",
                      )}:${values.preferredMinute.padStart(2, "0")}`
                    : "app default";
                const previewName =
                  template?.name ?? (values.customName.trim() || "Care");
                return (
                  <View className="gap-2 rounded-2xl bg-accent-soft/40 p-3">
                    <Text className="font-medium text-foreground text-sm">
                      Preview
                    </Text>
                    <Text className="text-foreground text-xs leading-4">
                      {previewName}{" "}
                      {interval
                        ? `every ${interval} day${interval === 1 ? "" : "s"}`
                        : "as a one-off task"}
                      . Next due{" "}
                      {nextDue ? format(nextDue, "EEE, MMM d") : "when set"}.
                    </Text>
                    <Text className="text-muted text-xs">
                      Reminder time: {reminder}. Reminders are off unless
                      enabled in Settings.
                    </Text>
                    {nextDue ? (
                      <Text className="text-muted text-xs">
                        Queue label: {relativeDueLabel(nextDue)}
                      </Text>
                    ) : null}
                  </View>
                );
              }}
            </form.Subscribe>

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
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
