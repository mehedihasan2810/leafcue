import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { buildBackupPayload, parseBackupJson } from "@/lib/backup";
import type { LeafCueDatabase } from "@/lib/db";
import type { BackupPayload } from "@/lib/db/zod";

const BACKUP_DIR_NAME = "backups";

function ensureBackupDir(): Directory {
  const dir = new Directory(Paths.cache, BACKUP_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function timestampedFilename(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `leafcue-backup-${yyyy}-${mm}-${dd}-${hh}${mi}.json`;
}

export type ExportOutcome =
  | { kind: "shared"; uri: string; photoFileCount: number }
  | { kind: "saved"; uri: string; photoFileCount: number }
  | { kind: "unavailable"; uri: string; photoFileCount: number };

/**
 * Build a backup, write it to the cache directory, and present a share sheet.
 * Returns the destination URI so callers can show a confirmation.
 */
export async function exportBackup(
  db: LeafCueDatabase,
): Promise<ExportOutcome> {
  const result = buildBackupPayload(db);
  const photoFileCount = result.photoFileCount;
  const json = JSON.stringify(result, null, 2);
  const dir = ensureBackupDir();
  const file = new File(dir, timestampedFilename());
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(json);

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    return { kind: "unavailable", uri: file.uri, photoFileCount };
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Share LeafCue backup",
    UTI: "public.json",
  });
  return { kind: "shared", uri: file.uri, photoFileCount };
}

export type PickedBackup =
  | { canceled: true }
  | { canceled: false; payload: BackupPayload; sourceUri: string };

/**
 * Open the system file picker, parse JSON content, and validate the schema.
 */
export async function pickBackupFile(): Promise<PickedBackup> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "*/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets[0]) {
    return { canceled: true };
  }

  const asset = result.assets[0];
  const file = new File(asset.uri);
  const text = await file.text();
  const payload = parseBackupJson(text);
  return { canceled: false, payload, sourceUri: asset.uri };
}
