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
import { PhotoPickerField } from "@/components/photo-picker-field";
import {
  FormChipGroupField,
  type FormChipOption,
} from "@/components/tanstack-form-fields";
import { type JournalEntryType, journalEntryTypeValues } from "@/lib/db/schema";
import type { JournalEntry } from "@/lib/db/types";
import {
  type JournalEntryInsertInput,
  journalEntryInsertSchema,
} from "@/lib/db/zod";

type JournalMood =
  | "happy"
  | "thriving"
  | "struggling"
  | "needs_help"
  | "watching";

const moodOptions: ReadonlyArray<FormChipOption<JournalMood>> = [
  { value: "happy", label: "Happy", icon: "happy-outline" },
  { value: "thriving", label: "Thriving", icon: "leaf-outline" },
  { value: "struggling", label: "Struggling", icon: "sad-outline" },
  { value: "needs_help", label: "Needs help", icon: "help-circle-outline" },
  { value: "watching", label: "Watching", icon: "eye-outline" },
];

const ENTRY_TYPE_LABEL: Record<JournalEntryType, string> = {
  note: "Note",
  milestone: "Milestone",
  issue: "Issue",
  treatment: "Treatment",
  observation: "Observation",
};

const entryTypeOptions: ReadonlyArray<FormChipOption<JournalEntryType>> =
  journalEntryTypeValues.map((value) => ({
    value,
    label: ENTRY_TYPE_LABEL[value],
  }));

export type JournalFormValues = {
  title: string;
  body: string;
  mood: JournalMood | null;
  entryType: JournalEntryType;
  photoUri: string | null;
};

type JournalFormSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: JournalEntry | null;
  onSubmit: (
    values: Pick<
      JournalEntryInsertInput,
      "body" | "title" | "mood" | "entryType" | "photoUri"
    >,
  ) => Promise<void> | void;
  onDelete?: () => void;
};

function buildInitial(
  initial: JournalEntry | null | undefined,
): JournalFormValues {
  if (initial) {
    return {
      title: initial.title ?? "",
      body: initial.body,
      mood: (initial.mood as JournalMood | null) ?? null,
      entryType: initial.entryType,
      photoUri: initial.photoUri ?? null,
    };
  }
  return {
    title: "",
    body: "",
    mood: null,
    entryType: "note",
    photoUri: null,
  };
}

export function JournalFormSheet({
  isOpen,
  onOpenChange,
  initial,
  onSubmit,
  onDelete,
}: JournalFormSheetProps) {
  const danger = useThemeColor("danger");

  const defaults = useMemo(() => buildInitial(initial), [initial]);

  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      await onSubmit({
        title: value.title.trim() || null,
        body: value.body.trim(),
        mood: value.mood,
        entryType: value.entryType,
        photoUri: value.photoUri,
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
                {isEdit ? "Edit journal entry" : "New journal entry"}
              </BottomSheet.Title>
              <BottomSheet.Description className="text-muted">
                Capture this plant's story.
              </BottomSheet.Description>
            </View>

            <form.Field name="title">
              {(field) => (
                <TextField className="gap-1.5">
                  <Label>
                    <Label.Text>Title</Label.Text>
                  </Label>
                  <Input
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder="Optional"
                    maxLength={120}
                  />
                </TextField>
              )}
            </form.Field>

            <form.Field
              name="body"
              validators={{
                onChange: ({ value }) => {
                  const result =
                    journalEntryInsertSchema.shape.body.safeParse(value);
                  if (result.success) return undefined;
                  return result.error.issues[0]?.message ?? "Required";
                },
              }}
            >
              {(field) => {
                const firstError = field.state.meta.errors[0];
                const errorMessage =
                  typeof firstError === "string" ? firstError : undefined;
                return (
                  <TextField
                    className="gap-1.5"
                    isInvalid={Boolean(errorMessage)}
                    isRequired
                  >
                    <Label>
                      <Label.Text>Notes</Label.Text>
                    </Label>
                    <TextArea
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      onBlur={field.handleBlur}
                      placeholder="What happened? What did you notice?"
                      numberOfLines={6}
                      autoFocus
                    />
                    {errorMessage ? (
                      <FieldError>{errorMessage}</FieldError>
                    ) : null}
                  </TextField>
                );
              }}
            </form.Field>

            <form.Field name="entryType">
              {(field) => (
                <FormChipGroupField
                  label="Entry type"
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value ?? "note")}
                  options={entryTypeOptions}
                  allowClear={false}
                />
              )}
            </form.Field>

            <form.Field name="mood">
              {(field) => (
                <FormChipGroupField
                  label="Mood"
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  options={moodOptions}
                />
              )}
            </form.Field>

            <form.Field name="photoUri">
              {(field) => (
                <PhotoPickerField
                  value={field.state.value}
                  onChange={(uri) => field.handleChange(uri)}
                  size={100}
                  description="Photos stay on this device."
                />
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
                        {isEdit ? "Save" : "Add entry"}
                      </Button.Label>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </View>
            <Text className="text-center text-muted text-xs">
              Entries stay on this device.
            </Text>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
