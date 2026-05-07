import { Ionicons } from "@expo/vector-icons";
import { Button, PressableFeedback, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { SectionHeader } from "@/components/section-header";
import {
  type BackupCounts,
  importBackupMerge,
  importBackupReplace,
  previewBackupCounts,
} from "@/lib/backup";
import {
  type ExportOutcome,
  exportBackup,
  pickBackupFile,
} from "@/lib/backup/io";
import { useDatabase } from "@/lib/db";
import type { BackupPayload } from "@/lib/db/zod";
import { syncAllReminders } from "@/lib/notifications";
import { SettingsHeader } from "@/screens/settings/settings-header";

type Status =
  | { kind: "idle" }
  | { kind: "exporting" }
  | { kind: "exported"; outcome: ExportOutcome }
  | { kind: "picking" }
  | {
      kind: "preview";
      payload: BackupPayload;
      counts: BackupCounts;
    }
  | { kind: "importing"; mode: "merge" | "replace" }
  | { kind: "imported"; mode: "merge" | "replace"; counts: BackupCounts }
  | { kind: "error"; message: string };

export function BackupSettingsScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");
  const danger = useThemeColor("danger");
  const db = useDatabase();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const onExport = async () => {
    setStatus({ kind: "exporting" });
    try {
      const outcome = await exportBackup(db);
      setStatus({ kind: "exported", outcome });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Could not export backup.",
      });
    }
  };

  const onPick = async () => {
    setStatus({ kind: "picking" });
    try {
      const result = await pickBackupFile();
      if (result.canceled) {
        setStatus({ kind: "idle" });
        return;
      }
      setStatus({
        kind: "preview",
        payload: result.payload,
        counts: previewBackupCounts(result.payload),
      });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error
            ? `Backup file is invalid: ${err.message}`
            : "Backup file is invalid.",
      });
    }
  };

  const finishImport = async (mode: "merge" | "replace") => {
    if (status.kind !== "preview") return;
    const payload = status.payload;
    setStatus({ kind: "importing", mode });
    try {
      const counts =
        mode === "replace"
          ? importBackupReplace(db, payload)
          : importBackupMerge(db, payload);
      // Notification IDs were cleared during import; resync local reminders.
      try {
        await syncAllReminders(db);
      } catch {
        // best-effort
      }
      setStatus({ kind: "imported", mode, counts });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Could not import backup.",
      });
    }
  };

  const onMerge = () => {
    Alert.alert(
      "Merge import",
      "Plant data will be added with new IDs. Existing settings stay the same.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Merge", onPress: () => void finishImport("merge") },
      ],
    );
  };

  const onReplace = () => {
    Alert.alert(
      "Replace local data",
      "This deletes all current plants, logs, and settings, then restores from the backup. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replace",
          style: "destructive",
          onPress: () => void finishImport("replace"),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <SettingsHeader title="Backup & restore" />
      <Container className="px-6" isScrollable>
        <View className="gap-6" style={{ paddingBottom: insets.bottom + 32 }}>
          <View className="gap-3">
            <SectionHeader
              title="Export"
              caption="A versioned JSON file with your plants, logs, and settings."
            />
            <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
              <View className="flex-row items-start gap-2 rounded-2xl bg-accent-soft/40 p-3">
                <Ionicons name="image-outline" size={14} color={accent} />
                <Text className="flex-1 text-foreground text-xs">
                  Photos stored in the app are bundled as base64 in the JSON.
                  Exported JSON files can be large if you have many photos.
                </Text>
              </View>
              <Button
                onPress={() => {
                  void onExport();
                }}
                isDisabled={status.kind === "exporting"}
                accessibilityLabel="Export backup as JSON"
              >
                <Button.Label>
                  {status.kind === "exporting"
                    ? "Preparing backup…"
                    : "Export backup"}
                </Button.Label>
              </Button>
              {status.kind === "exported" ? (
                <View className="gap-1.5">
                  <Text className="text-muted text-xs">
                    {status.outcome.kind === "shared"
                      ? "Shared. Save it to Files, iCloud Drive, or send it to yourself."
                      : status.outcome.kind === "saved"
                        ? `Saved to ${status.outcome.uri}`
                        : "Sharing isn't available on this device. The file lives in app cache and may be cleared."}
                  </Text>
                  {status.outcome.photoFileCount > 0 ? (
                    <Text className="text-muted text-xs">
                      {status.outcome.photoFileCount} photo file
                      {status.outcome.photoFileCount === 1 ? "" : "s"} bundled
                      in this backup.
                    </Text>
                  ) : (
                    <Text className="text-muted text-xs">
                      No photos to bundle in this backup.
                    </Text>
                  )}
                </View>
              ) : null}
            </View>
          </View>

          <View className="gap-3">
            <SectionHeader
              title="Import"
              caption="Pick a previously exported JSON file."
            />
            <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
              <Button
                variant="secondary"
                onPress={() => {
                  void onPick();
                }}
                accessibilityLabel="Pick backup file"
                isDisabled={
                  status.kind === "picking" || status.kind === "importing"
                }
              >
                <Button.Label>
                  {status.kind === "picking"
                    ? "Picking file…"
                    : "Choose backup file"}
                </Button.Label>
              </Button>

              {status.kind === "preview" ? (
                <PreviewSummary
                  counts={status.counts}
                  onMerge={onMerge}
                  onReplace={onReplace}
                />
              ) : null}

              {status.kind === "imported" ? (
                <View className="gap-1 rounded-2xl bg-accent-soft/40 p-3">
                  <Text className="font-medium text-foreground text-sm">
                    Import complete
                  </Text>
                  <Text className="text-muted text-xs">
                    {status.mode === "replace"
                      ? "Local data was replaced from the backup."
                      : `Merged ${status.counts.plants} plant(s) into your library.`}
                  </Text>
                </View>
              ) : null}

              {status.kind === "error" ? (
                <View className="rounded-2xl bg-danger-soft/40 p-3">
                  <Text style={{ color: danger }} className="text-xs">
                    {status.message}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <Text className="px-1 text-center text-muted text-xs">
            Backups never leave your device unless you share them.
          </Text>
        </View>
      </Container>
    </View>
  );
}

function PreviewSummary({
  counts,
  onMerge,
  onReplace,
}: {
  counts: BackupCounts;
  onMerge: () => void;
  onReplace: () => void;
}) {
  const accent = useThemeColor("accent");

  const lines: ReadonlyArray<{ label: string; value: number }> = [
    { label: "Plants", value: counts.plants },
    { label: "Rooms", value: counts.rooms },
    { label: "Care logs", value: counts.careLogs },
    { label: "Schedules", value: counts.plantTaskSchedules },
    { label: "Photos", value: counts.plantPhotos },
    { label: "Journal entries", value: counts.journalEntries },
    { label: "Growth measurements", value: counts.growthMeasurements },
    { label: "Health observations", value: counts.healthObservations },
    { label: "Settings", value: counts.settings },
    { label: "Bundled photo files", value: counts.photoFiles },
  ];

  return (
    <View className="gap-3 rounded-2xl border border-border/40 p-3">
      <View className="flex-row items-center gap-2">
        <Ionicons name="documents-outline" size={16} color={accent} />
        <Text className="font-medium text-foreground text-sm">
          Backup preview
        </Text>
      </View>
      <View className="gap-1">
        {lines.map((line) => (
          <View
            key={line.label}
            className="flex-row items-center justify-between"
          >
            <Text className="text-muted text-xs">{line.label}</Text>
            <Text className="font-medium text-foreground text-xs">
              {line.value}
            </Text>
          </View>
        ))}
      </View>
      <View className="flex-row gap-2">
        <PressableFeedback
          accessibilityLabel="Merge import"
          accessibilityHint="Adds plant data with new IDs and keeps current settings."
          onPress={onMerge}
          className="flex-1 items-center justify-center rounded-2xl bg-accent-soft p-3"
        >
          <Text className="font-medium text-foreground text-sm">Merge</Text>
        </PressableFeedback>
        <PressableFeedback
          accessibilityLabel="Replace local data"
          accessibilityHint="Deletes existing data, then restores everything from the backup."
          onPress={onReplace}
          className="flex-1 items-center justify-center rounded-2xl bg-danger-soft/40 p-3"
        >
          <Text className="font-medium text-danger text-sm">Replace</Text>
        </PressableFeedback>
      </View>
    </View>
  );
}
