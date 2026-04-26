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

import {
  FormChipGroupField,
  type FormChipOption,
} from "@/components/tanstack-form-fields";
import { HEALTH_ISSUE_LABELS } from "@/lib/care/health-hints";
import { formatIsoDate, parseIsoDate } from "@/lib/dates";
import {
  type HealthIssueType,
  type HealthSeverity,
  type HealthStatus,
  healthIssueTypeValues,
  healthStatusValues,
} from "@/lib/db/schema";
import type { HealthObservation } from "@/lib/db/types";

const issueOptions: ReadonlyArray<FormChipOption<HealthIssueType>> =
  healthIssueTypeValues.map((value) => ({
    value,
    label: HEALTH_ISSUE_LABELS[value],
  }));

const severityOptions: ReadonlyArray<FormChipOption<HealthSeverity>> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUS_LABEL: Record<HealthStatus, string> = {
  active: "Active",
  improving: "Improving",
  resolved: "Resolved",
};

const statusOptions: ReadonlyArray<FormChipOption<HealthStatus>> =
  healthStatusValues.map((value) => ({
    value,
    label: STATUS_LABEL[value],
  }));

type ObservationFormValues = {
  issueType: HealthIssueType;
  severity: HealthSeverity;
  status: HealthStatus;
  observedAtIso: string;
  notes: string;
};

type ObservationFormSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: HealthObservation | null;
  onSubmit: (values: {
    issueType: string;
    severity: HealthSeverity;
    status: HealthStatus;
    observedAt: Date;
    notes: string | null;
  }) => Promise<void> | void;
  onDelete?: () => void;
};

function buildInitial(
  initial: HealthObservation | null | undefined,
): ObservationFormValues {
  if (initial) {
    const issue = healthIssueTypeValues.find(
      (value) => value === initial.issueType,
    );
    return {
      issueType: issue ?? "other",
      severity: initial.severity,
      status: initial.status,
      observedAtIso: formatIsoDate(initial.observedAt),
      notes: initial.notes ?? "",
    };
  }
  return {
    issueType: "yellow_leaves",
    severity: "low",
    status: "active",
    observedAtIso: formatIsoDate(new Date()),
    notes: "",
  };
}

export function ObservationFormSheet({
  isOpen,
  onOpenChange,
  initial,
  onSubmit,
  onDelete,
}: ObservationFormSheetProps) {
  const danger = useThemeColor("danger");

  const defaults = useMemo(() => buildInitial(initial), [initial]);

  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      const observedAt =
        value.observedAtIso.trim().length > 0
          ? (parseIsoDate(value.observedAtIso) ?? new Date())
          : new Date();
      await onSubmit({
        issueType: value.issueType,
        severity: value.severity,
        status: value.status,
        observedAt,
        notes: value.notes.trim() || null,
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
        <BottomSheet.Content snapPoints={["80%", "95%"]}>
          <View className="gap-4">
            <View>
              <BottomSheet.Title className="text-foreground">
                {isEdit ? "Edit observation" : "Log health observation"}
              </BottomSheet.Title>
              <BottomSheet.Description className="text-muted">
                Notes stay on this device.
              </BottomSheet.Description>
            </View>

            <form.Field name="issueType">
              {(field) => (
                <FormChipGroupField
                  label="What did you notice?"
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value ?? "other")
                  }
                  options={issueOptions}
                  allowClear={false}
                />
              )}
            </form.Field>

            <form.Field name="severity">
              {(field) => (
                <FormChipGroupField
                  label="Severity"
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value ?? "low")}
                  options={severityOptions}
                  allowClear={false}
                />
              )}
            </form.Field>

            <form.Field name="status">
              {(field) => (
                <FormChipGroupField
                  label="Status"
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value ?? "active")
                  }
                  options={statusOptions}
                  allowClear={false}
                />
              )}
            </form.Field>

            <form.Field name="observedAtIso">
              {(field) => {
                const trimmed = field.state.value.trim();
                const invalid =
                  trimmed.length > 0 && parseIsoDate(trimmed) === null;
                return (
                  <TextField className="gap-1.5" isInvalid={invalid}>
                    <Label>
                      <Label.Text>Observed on</Label.Text>
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

            <form.Field name="notes">
              {(field) => (
                <TextField className="gap-1.5">
                  <Label>
                    <Label.Text>Notes</Label.Text>
                  </Label>
                  <TextArea
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder="Where? When did it start?"
                    numberOfLines={4}
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
                      <Button.Label>{isEdit ? "Save" : "Log"}</Button.Label>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </View>

            <Text className="text-center text-muted text-xs">
              These notes are advisory, not diagnostic.
            </Text>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
