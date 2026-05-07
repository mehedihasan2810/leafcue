import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import {
  cn,
  FieldError,
  Input,
  Label,
  PressableFeedback,
  Switch,
  TextArea,
  TextField,
  useThemeColor,
} from "heroui-native";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import DatePicker from "react-native-date-picker";

import { formatIsoDate, parseIsoDate } from "@/lib/dates";

type FieldErrors = ReadonlyArray<unknown>;

function firstErrorMessage(errors: FieldErrors): string | undefined {
  for (const error of errors) {
    if (!error) continue;
    if (typeof error === "string") return error;
    if (typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
  }
  return undefined;
}

type BaseFieldProps = {
  label: string;
  description?: string;
  errors?: FieldErrors;
  isRequired?: boolean;
  className?: string;
};

type FormTextFieldProps = BaseFieldProps & {
  value: string | null | undefined;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  keyboardType?: ComponentProps<typeof Input>["keyboardType"];
  autoCapitalize?: ComponentProps<typeof Input>["autoCapitalize"];
  autoCorrect?: boolean;
  maxLength?: number;
  multiline?: boolean;
  textContentType?: ComponentProps<typeof Input>["textContentType"];
};

export function FormTextField({
  label,
  description,
  errors,
  isRequired,
  className,
  value,
  onChangeText,
  onBlur,
  placeholder,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  maxLength,
  multiline,
  textContentType,
}: FormTextFieldProps) {
  const errorMessage = firstErrorMessage(errors ?? []);
  const isInvalid = Boolean(errorMessage);

  return (
    <TextField
      isInvalid={isInvalid}
      isRequired={isRequired}
      className={cn("gap-1.5", className)}
    >
      <Label>
        <Label.Text>{label}</Label.Text>
      </Label>
      <Input
        value={value ?? ""}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        maxLength={maxLength}
        multiline={multiline}
        textContentType={textContentType}
      />
      {description && !isInvalid ? (
        <Text className="text-muted text-xs">{description}</Text>
      ) : null}
      {isInvalid ? <FieldError>{errorMessage}</FieldError> : null}
    </TextField>
  );
}

type FormTextAreaProps = BaseFieldProps & {
  value: string | null | undefined;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  numberOfLines?: number;
};

export function FormTextArea({
  label,
  description,
  errors,
  isRequired,
  className,
  value,
  onChangeText,
  onBlur,
  placeholder,
  numberOfLines = 4,
}: FormTextAreaProps) {
  const errorMessage = firstErrorMessage(errors ?? []);
  const isInvalid = Boolean(errorMessage);

  return (
    <TextField
      isInvalid={isInvalid}
      isRequired={isRequired}
      className={cn("gap-1.5", className)}
    >
      <Label>
        <Label.Text>{label}</Label.Text>
      </Label>
      <TextArea
        value={value ?? ""}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        numberOfLines={numberOfLines}
      />
      {description && !isInvalid ? (
        <Text className="text-muted text-xs">{description}</Text>
      ) : null}
      {isInvalid ? <FieldError>{errorMessage}</FieldError> : null}
    </TextField>
  );
}

type FormSwitchFieldProps = BaseFieldProps & {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function FormSwitchField({
  label,
  description,
  errors,
  className,
  value,
  onValueChange,
}: FormSwitchFieldProps) {
  const errorMessage = firstErrorMessage(errors ?? []);
  const isInvalid = Boolean(errorMessage);

  return (
    <View
      className={cn(
        "flex-row items-center justify-between gap-3 rounded-2xl border border-border/40 bg-surface px-4 py-3",
        className,
      )}
    >
      <View className="flex-1 gap-1">
        <Text className="font-medium text-base text-foreground">{label}</Text>
        {description ? (
          <Text className="text-muted text-xs">{description}</Text>
        ) : null}
        {isInvalid ? (
          <Text className="text-danger text-xs">{errorMessage}</Text>
        ) : null}
      </View>
      <Switch isSelected={value} onSelectedChange={onValueChange}>
        <Switch.Thumb />
      </Switch>
    </View>
  );
}

export type FormChipOption<TValue extends string> = {
  value: TValue;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  description?: string;
};

type FormChipGroupFieldProps<TValue extends string> = BaseFieldProps & {
  value: TValue | null | undefined;
  onValueChange: (value: TValue | null) => void;
  options: ReadonlyArray<FormChipOption<TValue>>;
  allowClear?: boolean;
};

export function FormChipGroupField<TValue extends string>({
  label,
  description,
  errors,
  className,
  value,
  onValueChange,
  options,
  allowClear = true,
}: FormChipGroupFieldProps<TValue>) {
  const errorMessage = firstErrorMessage(errors ?? []);
  const isInvalid = Boolean(errorMessage);
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <View className={cn("gap-1.5", className)}>
      <Label>
        <Label.Text>{label}</Label.Text>
      </Label>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <PressableFeedback
              key={option.value}
              onPress={() => {
                if (isSelected && allowClear) {
                  onValueChange(null);
                } else {
                  onValueChange(option.value);
                }
              }}
              className={cn(
                "flex-row items-center gap-1.5 rounded-full border px-3 py-2",
                isSelected
                  ? "border-accent bg-accent-soft"
                  : "border-border/60 bg-surface",
              )}
            >
              {option.icon ? (
                <Ionicons
                  name={option.icon}
                  size={14}
                  color={isSelected ? accent : muted}
                />
              ) : null}
              <Text
                className={cn(
                  "font-medium text-sm",
                  isSelected
                    ? "text-accent-soft-foreground"
                    : "text-foreground",
                )}
              >
                {option.label}
              </Text>
            </PressableFeedback>
          );
        })}
      </View>
      {description && !isInvalid ? (
        <Text className="text-muted text-xs">{description}</Text>
      ) : null}
      {isInvalid ? (
        <Text className="text-danger text-xs">{errorMessage}</Text>
      ) : null}
    </View>
  );
}

type FormSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type FormSelectFieldProps = BaseFieldProps & {
  value: string | null | undefined;
  onValueChange: (value: string | null) => void;
  options: ReadonlyArray<FormSelectOption>;
  placeholder?: string;
  allowClear?: boolean;
  ctaLabel?: string;
  onPressCta?: () => void;
};

export function FormSelectField({
  label,
  description,
  errors,
  className,
  value,
  onValueChange,
  options,
  placeholder = "Choose…",
  allowClear = true,
  ctaLabel,
  onPressCta,
}: FormSelectFieldProps) {
  const errorMessage = firstErrorMessage(errors ?? []);
  const isInvalid = Boolean(errorMessage);

  return (
    <View className={cn("gap-1.5", className)}>
      <View className="flex-row items-center justify-between">
        <Label>
          <Label.Text>{label}</Label.Text>
        </Label>
        {ctaLabel ? (
          <PressableFeedback onPress={onPressCta}>
            <Text className="font-medium text-accent text-xs">{ctaLabel}</Text>
          </PressableFeedback>
        ) : null}
      </View>

      {options.length === 0 ? (
        <View className="rounded-2xl border border-border/60 border-dashed bg-surface px-4 py-3">
          <Text className="text-muted text-sm">{placeholder}</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <PressableFeedback
                key={option.value}
                onPress={() => {
                  if (isSelected && allowClear) {
                    onValueChange(null);
                  } else {
                    onValueChange(option.value);
                  }
                }}
                className={cn(
                  "rounded-2xl border px-3 py-2",
                  isSelected
                    ? "border-accent bg-accent-soft"
                    : "border-border/60 bg-surface",
                )}
              >
                <Text
                  className={cn(
                    "font-medium text-sm",
                    isSelected
                      ? "text-accent-soft-foreground"
                      : "text-foreground",
                  )}
                >
                  {option.label}
                </Text>
                {option.description ? (
                  <Text className="text-muted text-xs">
                    {option.description}
                  </Text>
                ) : null}
              </PressableFeedback>
            );
          })}
        </View>
      )}

      {description && !isInvalid ? (
        <Text className="text-muted text-xs">{description}</Text>
      ) : null}
      {isInvalid ? (
        <Text className="text-danger text-xs">{errorMessage}</Text>
      ) : null}
    </View>
  );
}

type FormDatePickerFieldProps = BaseFieldProps & {
  /** ISO date string (YYYY-MM-DD) or empty */
  value: string;
  /** Called with the new ISO date string, or empty string if cleared */
  onChange: (value: string) => void;
};

export function FormDatePickerField({
  label,
  description,
  errors,
  isRequired,
  className,
  value,
  onChange,
}: FormDatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const errorMessage = firstErrorMessage(errors ?? []);
  const isInvalid = Boolean(errorMessage);
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  const selectedDate = value.trim().length > 0 ? parseIsoDate(value) : null;
  const pickerDate = selectedDate ?? new Date();
  const displayText = selectedDate ? format(selectedDate, "MMM d, yyyy") : null;

  const handleConfirm = (date: Date) => {
    setOpen(false);
    onChange(formatIsoDate(date));
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <>
      <View className={cn("gap-1.5", className)}>
        <Label>
          <Label.Text>{label}</Label.Text>
        </Label>

        <PressableFeedback onPress={() => setOpen(true)}>
          <View
            className={cn(
              "flex-row items-center justify-between rounded-2xl border bg-surface px-4 py-3.5",
              isInvalid
                ? "border-danger"
                : displayText
                  ? "border-accent/50"
                  : "border-border/60",
            )}
          >
            <View className="flex-1 flex-row items-center gap-2.5">
              <Ionicons
                name="calendar-outline"
                size={18}
                color={displayText ? accent : muted}
              />
              {displayText ? (
                <Text className="font-medium text-base text-foreground">
                  {displayText}
                </Text>
              ) : (
                <Text className="text-base text-muted">Select date</Text>
              )}
            </View>
            {displayText ? (
              <TouchableOpacity
                onPress={handleClear}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color={muted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </PressableFeedback>

        {description && !isInvalid ? (
          <Text className="text-muted text-xs">{description}</Text>
        ) : null}
        {isInvalid ? <FieldError>{errorMessage}</FieldError> : null}
      </View>

      <DatePicker
        modal
        open={open}
        date={pickerDate}
        mode="date"
        theme="auto"
        title={null}
        confirmText="Done"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <View className={cn("gap-3", className)}>
      <View className="flex-row items-end justify-between gap-2">
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-base text-foreground">
            {title}
          </Text>
          {description ? (
            <Text className="text-muted text-xs">{description}</Text>
          ) : null}
        </View>
        {action}
      </View>
      <View className="gap-3">{children}</View>
    </View>
  );
}
