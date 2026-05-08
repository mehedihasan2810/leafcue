import { sql } from "drizzle-orm";
import { MAX_BACKUP_FILE_BYTES } from "@/lib/backup/limits";
import {
  insertBackupTables,
  restorePhotoFiles,
} from "@/lib/backup/restore-graph";
import type { LeafCueDatabase } from "@/lib/db";
import {
  appSettings,
  careLogs,
  careTaskTemplates,
  growthMeasurements,
  healthObservations,
  journalEntries,
  onboardingState,
  plantPhotos,
  plantPresets,
  plants,
  plantTaskSchedules,
  rooms,
  shelves,
} from "@/lib/db/schema";
import {
  type BackupPayload,
  type BackupPhotoFile,
  type BackupTables,
  backupPayloadSchema,
  backupTablesSchema,
} from "@/lib/db/zod";
import { PHOTO_DIR_NAME, readPhotoAsBase64 } from "@/lib/photos";

function dateToIso(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function serializeRow<T extends Record<string, unknown>>(
  row: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = dateToIso(value);
  }
  return out;
}

function serializeRows<T extends Record<string, unknown>>(
  rows: ReadonlyArray<T>,
): Array<Record<string, unknown>> {
  return rows.map((row) => serializeRow(row));
}

/** Collect all unique photo URIs stored in the app photo directory. */
function collectPhotoUris(tables: BackupTables): string[] {
  const uris = new Set<string>();

  for (const row of tables.plants) {
    if (row.photoUri?.includes(`/${PHOTO_DIR_NAME}/`)) {
      uris.add(row.photoUri);
    }
  }
  for (const row of tables.plantPhotos) {
    if (row.uri.includes(`/${PHOTO_DIR_NAME}/`)) {
      uris.add(row.uri);
    }
  }
  for (const row of tables.journalEntries) {
    if (row.photoUri?.includes(`/${PHOTO_DIR_NAME}/`)) {
      uris.add(row.photoUri);
    }
  }

  return [...uris];
}

export type BackupCounts = {
  plants: number;
  rooms: number;
  shelves: number;
  plantPhotos: number;
  plantPresets: number;
  careTaskTemplates: number;
  plantTaskSchedules: number;
  careLogs: number;
  journalEntries: number;
  growthMeasurements: number;
  healthObservations: number;
  settings: number;
  onboardingState: number;
  photoFiles: number;
};

export function buildBackupPayload(
  db: LeafCueDatabase,
): BackupPayload & { photoFileCount: number } {
  const tables = backupTablesSchema.parse({
    plantPresets: serializeRows(db.select().from(plantPresets).all()),
    rooms: serializeRows(db.select().from(rooms).all()),
    shelves: serializeRows(db.select().from(shelves).all()),
    plants: serializeRows(db.select().from(plants).all()),
    plantPhotos: serializeRows(db.select().from(plantPhotos).all()),
    careTaskTemplates: serializeRows(db.select().from(careTaskTemplates).all()),
    plantTaskSchedules: serializeRows(
      db.select().from(plantTaskSchedules).all(),
    ),
    careLogs: serializeRows(db.select().from(careLogs).all()),
    journalEntries: serializeRows(db.select().from(journalEntries).all()),
    growthMeasurements: serializeRows(
      db.select().from(growthMeasurements).all(),
    ),
    healthObservations: serializeRows(
      db.select().from(healthObservations).all(),
    ),
  });

  const settingsRows = db
    .select()
    .from(appSettings)
    .all()
    .map((row) => ({
      key: row.key,
      value: row.value,
      updatedAt: row.updatedAt.toISOString(),
    }));

  const onboardingRows = db
    .select()
    .from(onboardingState)
    .all()
    .map((row) => ({
      key: row.key,
      value: row.value,
      updatedAt: row.updatedAt.toISOString(),
    }));

  // Bundle photo files as base64
  const photoUris = collectPhotoUris(tables);
  const photoFiles: Record<string, BackupPhotoFile> = {};
  for (const uri of photoUris) {
    const result = readPhotoAsBase64(uri);
    if (result) {
      const filename = uri.split("/").pop() ?? "photo.jpg";
      photoFiles[uri] = {
        path: uri,
        filename,
        mimeType: result.mimeType,
        data: result.base64,
      };
    }
  }

  const payload = backupPayloadSchema.parse({
    version: 2,
    exportedAt: new Date().toISOString(),
    metadata: { appVersion: "1.0.0", platform: "native" },
    tables,
    settings: settingsRows,
    onboardingState: onboardingRows,
    photoFiles: Object.keys(photoFiles).length > 0 ? photoFiles : undefined,
  });

  return { ...payload, photoFileCount: Object.keys(photoFiles).length };
}

export function parseBackupJson(raw: string): BackupPayload {
  if (raw.length > MAX_BACKUP_FILE_BYTES) {
    throw new Error("Backup file is too large to import.");
  }
  const parsed: unknown = JSON.parse(raw);
  return backupPayloadSchema.parse(parsed);
}

export function previewBackupCounts(payload: BackupPayload): BackupCounts {
  const t = payload.tables;
  return {
    plants: t.plants.length,
    rooms: t.rooms.length,
    shelves: t.shelves.length,
    plantPhotos: t.plantPhotos.length,
    plantPresets: t.plantPresets.length,
    careTaskTemplates: t.careTaskTemplates.length,
    plantTaskSchedules: t.plantTaskSchedules.length,
    careLogs: t.careLogs.length,
    journalEntries: t.journalEntries.length,
    growthMeasurements: t.growthMeasurements.length,
    healthObservations: t.healthObservations.length,
    settings: payload.settings.length,
    onboardingState: payload.onboardingState.length,
    photoFiles: payload.photoFiles ? Object.keys(payload.photoFiles).length : 0,
  };
}

export type ImportSummary = BackupCounts;

/**
 * Replace import: wipes existing local data within a transaction and
 * re-inserts everything from the payload. Settings and onboarding state are
 * also restored from the backup.
 */
export function importBackupReplace(
  db: LeafCueDatabase,
  payload: BackupPayload,
): ImportSummary {
  const validated = backupPayloadSchema.parse(payload);
  const counts: ImportSummary = previewBackupCounts(validated);

  // Restore bundled photo files to this device and remap imported URIs.
  const restoredPhotoUris = restorePhotoFiles(validated);

  db.transaction((tx) => {
    // Wipe in dependency-safe order (FKs use cascade where possible).
    tx.delete(careLogs).where(sql`1 = 1`).run();
    tx.delete(plantTaskSchedules).where(sql`1 = 1`).run();
    tx.delete(plantPhotos).where(sql`1 = 1`).run();
    tx.delete(growthMeasurements).where(sql`1 = 1`).run();
    tx.delete(healthObservations).where(sql`1 = 1`).run();
    tx.delete(journalEntries).where(sql`1 = 1`).run();
    tx.delete(plants).where(sql`1 = 1`).run();
    tx.delete(shelves).where(sql`1 = 1`).run();
    tx.delete(rooms).where(sql`1 = 1`).run();
    tx.delete(careTaskTemplates).where(sql`1 = 1`).run();
    tx.delete(plantPresets).where(sql`1 = 1`).run();
    tx.delete(appSettings).where(sql`1 = 1`).run();
    tx.delete(onboardingState).where(sql`1 = 1`).run();

    insertBackupTables(tx, validated, {
      remapIds: false,
      restoredPhotoUris,
    });
  });

  return counts;
}

/**
 * Merge import: appends plant data from the payload, remapping IDs to avoid
 * collisions. Existing settings and onboarding state are preserved.
 */
export function importBackupMerge(
  db: LeafCueDatabase,
  payload: BackupPayload,
): ImportSummary {
  const validated = backupPayloadSchema.parse(payload);
  const counts: ImportSummary = previewBackupCounts(validated);

  // Restore bundled photo files to this device and remap imported URIs.
  const restoredPhotoUris = restorePhotoFiles(validated);

  db.transaction((tx) => {
    insertBackupTables(tx, validated, {
      remapIds: true,
      restoredPhotoUris,
    });
  });

  return counts;
}
