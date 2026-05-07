import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Button,
  Chip,
  cn,
  FieldError,
  Input,
  Label,
  PressableFeedback,
  Switch,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { SectionHeader } from "@/components/section-header";
import { useDatabase } from "@/lib/db";
import {
  type NotificationPreviewStyle,
  notificationPreviewStyleValues,
} from "@/lib/db/zod";
import { useReminderStore } from "@/stores/use-reminder-store";

const PREVIEW_OPTIONS: ReadonlyArray<{
  value: NotificationPreviewStyle;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    value: "detailed",
    label: "Detailed",
    description: "Show plant nickname and task in the notification.",
    icon: "reader-outline",
  },
  {
    value: "discreet",
    label: "Discreet",
    description: "Generic copy that hides specifics on the lock screen.",
    icon: "eye-off-outline",
  },
];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function parseHour(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 23) return null;
  return Math.floor(parsed);
}

function parseMinute(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 59) return null;
  return Math.floor(parsed);
}

export function RemindersSettingsScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const danger = useThemeColor("danger");

  const db = useDatabase();
  const settings = useReminderStore((state) => state.settings);
  const permissionStatus = useReminderStore((state) => state.permissionStatus);
  const hydrated = useReminderStore((state) => state.hydrated);
  const setEnabled = useReminderStore((state) => state.setEnabled);
  const setReminderTime = useReminderStore((state) => state.setReminderTime);
  const setQuietHours = useReminderStore((state) => state.setQuietHours);
  const setPreviewStyle = useReminderStore((state) => state.setPreviewStyle);

  const [hourText, setHourText] = useState(pad(settings.hour));
  const [minuteText, setMinuteText] = useState(pad(settings.minute));
  const [quietStartText, setQuietStartText] = useState(
    pad(settings.quietStartHour),
  );
  const [quietEndText, setQuietEndText] = useState(pad(settings.quietEndHour));

  useEffect(() => {
    setHourText(pad(settings.hour));
    setMinuteText(pad(settings.minute));
    setQuietStartText(pad(settings.quietStartHour));
    setQuietEndText(pad(settings.quietEndHour));
  }, [
    settings.hour,
    settings.minute,
    settings.quietStartHour,
    settings.quietEndHour,
  ]);

  const hourValue = parseHour(hourText);
  const minuteValue = parseMinute(minuteText);
  const quietStartValue = parseHour(quietStartText);
  const quietEndValue = parseHour(quietEndText);

  const timeError = useMemo(() => {
    if (hourValue === null) return "Hour must be 0–23.";
    if (minuteValue === null) return "Minute must be 0–59.";
    return null;
  }, [hourValue, minuteValue]);

  const quietError = useMemo(() => {
    if (!settings.quietHoursEnabled) return null;
    if (quietStartValue === null || quietEndValue === null) {
      return "Quiet hours must be 0–23.";
    }
    return null;
  }, [settings.quietHoursEnabled, quietStartValue, quietEndValue]);

  const handleToggleEnabled = async (next: boolean) => {
    await setEnabled(db, next);
  };

  const handleSaveTime = async () => {
    if (hourValue === null || minuteValue === null) return;
    await setReminderTime(db, hourValue, minuteValue);
  };

  const handleToggleQuiet = async (enabled: boolean) => {
    await setQuietHours(db, {
      enabled,
      startHour: settings.quietStartHour,
      endHour: settings.quietEndHour,
    });
  };

  const handleSaveQuietHours = async () => {
    if (quietStartValue === null || quietEndValue === null) return;
    await setQuietHours(db, {
      enabled: settings.quietHoursEnabled,
      startHour: quietStartValue,
      endHour: quietEndValue,
    });
  };

  const handlePreviewStyle = async (style: NotificationPreviewStyle) => {
    await setPreviewStyle(db, style);
  };

  const showPermissionWarning =
    settings.enabled &&
    (permissionStatus === "denied" || permissionStatus === "undetermined");

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center justify-between px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
      >
        <PressableFeedback
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="chevron-back" size={20} color={muted} />
        </PressableFeedback>
        <Text className="font-semibold text-base text-foreground">
          Reminders
        </Text>
        <View className="w-9" />
      </View>

      <Container className="px-6" isScrollable>
        <View className="gap-6" style={{ paddingBottom: insets.bottom + 32 }}>
          <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={accent}
                />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-base text-foreground">
                  Local reminders
                </Text>
                <Text className="text-muted text-xs">
                  We schedule them on your device. Nothing is uploaded.
                </Text>
              </View>
              <Switch
                isSelected={settings.enabled}
                onSelectedChange={(next) => {
                  void handleToggleEnabled(next);
                }}
                isDisabled={!hydrated}
              >
                <Switch.Thumb />
              </Switch>
            </View>
            {showPermissionWarning ? (
              <View className="flex-row items-start gap-2 rounded-2xl bg-warning-soft/40 p-3">
                <Ionicons
                  name="alert-circle-outline"
                  size={14}
                  color={danger}
                />
                <Text
                  className="flex-1 text-foreground text-xs"
                  style={{ color: danger }}
                >
                  We don't have notification permission yet. Toggle reminders to
                  ask again.
                </Text>
              </View>
            ) : null}
          </View>

          <View className="gap-3">
            <SectionHeader
              title="Reminder time"
              caption="When daily care notifications fire."
            />
            <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
              <View className="flex-row gap-2">
                <TextField
                  className="flex-1 gap-1.5"
                  isInvalid={hourValue === null}
                >
                  <Label>
                    <Label.Text>Hour (0–23)</Label.Text>
                  </Label>
                  <Input
                    value={hourText}
                    onChangeText={setHourText}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </TextField>
                <TextField
                  className="flex-1 gap-1.5"
                  isInvalid={minuteValue === null}
                >
                  <Label>
                    <Label.Text>Minute (0–59)</Label.Text>
                  </Label>
                  <Input
                    value={minuteText}
                    onChangeText={setMinuteText}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </TextField>
              </View>
              {timeError ? <FieldError>{timeError}</FieldError> : null}
              <Button
                size="sm"
                isDisabled={timeError !== null}
                onPress={() => {
                  void handleSaveTime();
                }}
              >
                <Button.Label>Save reminder time</Button.Label>
              </Button>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { hour: 7, minute: 0, label: "7:00" },
                  { hour: 9, minute: 0, label: "9:00" },
                  { hour: 18, minute: 30, label: "18:30" },
                  { hour: 21, minute: 0, label: "21:00" },
                ].map((option) => {
                  const isActive =
                    settings.hour === option.hour &&
                    settings.minute === option.minute;
                  return (
                    <Chip
                      key={option.label}
                      size="sm"
                      variant={isActive ? "primary" : "secondary"}
                      color={isActive ? "accent" : "default"}
                      onPress={() => {
                        setHourText(pad(option.hour));
                        setMinuteText(pad(option.minute));
                        void setReminderTime(db, option.hour, option.minute);
                      }}
                    >
                      <Chip.Label>{option.label}</Chip.Label>
                    </Chip>
                  );
                })}
              </View>
            </View>
          </View>

          <View className="gap-3">
            <SectionHeader
              title="Quiet hours"
              caption="Push reminders out of these hours."
            />
            <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-medium text-foreground text-sm">
                  Enable quiet hours
                </Text>
                <Switch
                  isSelected={settings.quietHoursEnabled}
                  onSelectedChange={(next) => {
                    void handleToggleQuiet(next);
                  }}
                >
                  <Switch.Thumb />
                </Switch>
              </View>

              <View
                className={cn(
                  "gap-3",
                  settings.quietHoursEnabled ? null : "opacity-50",
                )}
              >
                <View className="flex-row gap-2">
                  <TextField
                    className="flex-1 gap-1.5"
                    isInvalid={
                      settings.quietHoursEnabled && quietStartValue === null
                    }
                  >
                    <Label>
                      <Label.Text>Start (hour)</Label.Text>
                    </Label>
                    <Input
                      value={quietStartText}
                      onChangeText={setQuietStartText}
                      keyboardType="number-pad"
                      maxLength={2}
                      editable={settings.quietHoursEnabled}
                    />
                  </TextField>
                  <TextField
                    className="flex-1 gap-1.5"
                    isInvalid={
                      settings.quietHoursEnabled && quietEndValue === null
                    }
                  >
                    <Label>
                      <Label.Text>End (hour)</Label.Text>
                    </Label>
                    <Input
                      value={quietEndText}
                      onChangeText={setQuietEndText}
                      keyboardType="number-pad"
                      maxLength={2}
                      editable={settings.quietHoursEnabled}
                    />
                  </TextField>
                </View>
                {quietError ? <FieldError>{quietError}</FieldError> : null}
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={
                    !settings.quietHoursEnabled || quietError !== null
                  }
                  onPress={() => {
                    void handleSaveQuietHours();
                  }}
                >
                  <Button.Label>Save quiet hours</Button.Label>
                </Button>
              </View>
            </View>
          </View>

          <View className="gap-3">
            <SectionHeader
              title="Preview style"
              caption="What people see on your lock screen."
            />
            <View className="gap-2 rounded-3xl border border-border/40 bg-surface p-4">
              {PREVIEW_OPTIONS.map((option) => {
                const isActive = settings.previewStyle === option.value;
                return (
                  <PressableFeedback
                    key={option.value}
                    onPress={() => {
                      void handlePreviewStyle(option.value);
                    }}
                    className={cn(
                      "flex-row items-start gap-3 rounded-2xl border p-3",
                      isActive
                        ? "border-accent bg-accent-soft/40"
                        : "border-border/40",
                    )}
                  >
                    <View className="size-9 items-center justify-center rounded-xl bg-accent-soft">
                      <Ionicons name={option.icon} size={16} color={accent} />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text className="font-medium text-foreground text-sm">
                        {option.label}
                      </Text>
                      <Text className="text-muted text-xs">
                        {option.description}
                      </Text>
                    </View>
                    {isActive ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={accent}
                      />
                    ) : null}
                  </PressableFeedback>
                );
              })}
            </View>
          </View>

          <Text className="text-center text-muted text-xs">
            Local-first: notifications never leave your device.
          </Text>
        </View>
      </Container>
    </View>
  );
}

export const previewStyles = notificationPreviewStyleValues;
