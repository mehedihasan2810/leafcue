import { sql } from "drizzle-orm";
import { File } from "expo-file-system";

import { MAX_BACKUP_FILE_BYTES } from "@/lib/backup/limits";
import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
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
import {
  ensurePhotoDir,
  PHOTO_DIR_NAME,
  readPhotoAsBase64,
  writePhotoBase64,
} from "@/lib/photos";

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

type CsvSummary = BackupCounts;

/** Write bundled photo files from the payload back to the device directory. */
function restorePhotoFiles(payload: BackupPayload): Map<string, string> {
  const restoredUris = new Map<string, string>();
  if (!payload.photoFiles) return restoredUris;
  ensurePhotoDir();
  for (const [uri, photoFile] of Object.entries(payload.photoFiles)) {
    const restoredUri = writePhotoFromBase64File(photoFile);
    if (restoredUri) {
      restoredUris.set(uri, restoredUri);
    }
  }
  return restoredUris;
}

function writePhotoFromBase64File(photoFile: BackupPhotoFile): string | null {
  try {
    const dir = ensurePhotoDir();
    const file = makeRestoredPhotoFile(dir, photoFile.filename);
    writePhotoBase64(file, photoFile.data);
    return file.uri;
  } catch {
    // Best-effort restore; the import can still work with missing photo files.
    return null;
  }
}

function makeRestoredPhotoFile(
  dir: ReturnType<typeof ensurePhotoDir>,
  filename: string,
): File {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const basename = filename
    .slice(0, -(extension.length + 1))
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  const safeBasename = basename.length > 0 ? basename : "photo";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const candidate = new File(
      dir,
      `${safeBasename}-${suffix}-${attempt}.${extension}`,
    );
    if (!candidate.exists) return candidate;
  }

  throw new Error("Could not create a unique restored photo filename.");
}

function resolveImportedPhotoUri(
  uri: string | null | undefined,
  restoredUris: Map<string, string>,
): string | null {
  if (!uri) return null;
  return restoredUris.get(uri) ?? uri;
}

export type ImportSummary = CsvSummary;

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

    insertAll(tx, validated, {
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
    insertAll(tx, validated, {
      remapIds: true,
      restoredPhotoUris,
    });
  });

  return counts;
}

type InsertOptions = {
  remapIds: boolean;
  restoredPhotoUris: Map<string, string>;
};

function insertAll(
  db: LeafCueDbOrTx,
  payload: BackupPayload,
  options: InsertOptions,
): void {
  const remap = makeEmptyRemap();
  const t = payload.tables;

  // Plant presets (dedupe by common+scientific when merging).
  for (const row of t.plantPresets) {
    const oldId = row.id ?? null;
    const insertValues = {
      commonName: row.commonName,
      scientificName: row.scientificName ?? null,
      careDifficulty: row.careDifficulty ?? null,
      light: row.light ?? null,
      water: row.water ?? null,
      humidity: row.humidity ?? null,
      temperature: row.temperature ?? null,
      soil: row.soil ?? null,
      fertilizer: row.fertilizer ?? null,
      petToxicity: row.petToxicity ?? null,
      careSummary: row.careSummary ?? null,
    };
    const inserted = db
      .insert(plantPresets)
      .values(insertValues)
      .onConflictDoNothing()
      .returning({ id: plantPresets.id })
      .get();
    if (oldId !== null && inserted) {
      remap.presets.set(oldId, inserted.id);
    }
  }

  // Rooms
  for (const row of t.rooms) {
    const oldId = row.id ?? null;
    const inserted = db
      .insert(rooms)
      .values({
        name: row.name,
        icon: row.icon ?? null,
        sortOrder: row.sortOrder ?? 0,
      })
      .returning({ id: rooms.id })
      .get();
    if (oldId !== null && inserted) {
      remap.rooms.set(oldId, inserted.id);
    }
  }

  // Shelves
  for (const row of t.shelves) {
    const oldId = row.id ?? null;
    const oldRoomId = row.roomId;
    const newRoomId = options.remapIds
      ? (remap.rooms.get(oldRoomId) ?? null)
      : oldRoomId;
    if (newRoomId === null) continue;
    const inserted = db
      .insert(shelves)
      .values({
        name: row.name,
        roomId: newRoomId,
        icon: row.icon ?? null,
        sortOrder: row.sortOrder ?? 0,
      })
      .returning({ id: shelves.id })
      .get();
    if (oldId !== null && inserted) {
      remap.shelves.set(oldId, inserted.id);
    }
  }

  // Plants
  for (const row of t.plants) {
    const oldId = row.id ?? null;
    const oldRoomId = row.roomId ?? null;
    const oldShelfId = row.shelfId ?? null;
    const oldPresetId = row.speciesPresetId ?? null;
    const newRoomId =
      oldRoomId === null
        ? null
        : options.remapIds
          ? (remap.rooms.get(oldRoomId) ?? null)
          : oldRoomId;
    const newShelfId =
      oldShelfId === null
        ? null
        : options.remapIds
          ? (remap.shelves.get(oldShelfId) ?? null)
          : oldShelfId;
    const newPresetId =
      oldPresetId === null
        ? null
        : options.remapIds
          ? (remap.presets.get(oldPresetId) ?? null)
          : oldPresetId;
    const inserted = db
      .insert(plants)
      .values({
        nickname: row.nickname,
        commonName: row.commonName ?? null,
        scientificName: row.scientificName ?? null,
        speciesPresetId: newPresetId,
        photoUri: resolveImportedPhotoUri(
          row.photoUri,
          options.restoredPhotoUris,
        ),
        roomId: newRoomId,
        shelfId: newShelfId,
        notes: row.notes ?? null,
        acquiredAt: getDate(row, "acquiredAt"),
        archivedAt: getDate(row, "archivedAt"),
        careDifficulty: row.careDifficulty ?? null,
        toxicity: row.toxicity ?? null,
        lightPreference: row.lightPreference ?? null,
        wateringPreference: row.wateringPreference ?? null,
        soilType: row.soilType ?? null,
        potType: row.potType ?? null,
        potSize: row.potSize ?? null,
        hasDrainage: row.hasDrainage ?? null,
        isFavorite: row.isFavorite ?? false,
      })
      .returning({ id: plants.id })
      .get();
    if (oldId !== null && inserted) {
      remap.plants.set(oldId, inserted.id);
    }
  }

  // Photos: URIs point to bundled photo files that were restored above.
  for (const row of t.plantPhotos) {
    const oldPlantId = row.plantId;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    db.insert(plantPhotos)
      .values({
        plantId: newPlantId,
        uri:
          resolveImportedPhotoUri(row.uri, options.restoredPhotoUris) ??
          row.uri,
        caption: row.caption ?? null,
        takenAt: getDate(row, "takenAt") ?? new Date(),
        type: row.type ?? "journal",
      })
      .run();
  }

  // Care task templates: dedupe by `key`.
  for (const row of t.careTaskTemplates) {
    const oldId = row.id ?? null;
    db.insert(careTaskTemplates)
      .values({
        key: row.key,
        name: row.name,
        icon: row.icon ?? null,
        defaultIntervalDays: row.defaultIntervalDays ?? null,
        defaultInstructions: row.defaultInstructions ?? null,
        colorKey: row.colorKey ?? null,
        isBuiltIn: row.isBuiltIn ?? false,
      })
      .onConflictDoNothing()
      .run();
    const found = db
      .select({ id: careTaskTemplates.id })
      .from(careTaskTemplates)
      .where(sql`${careTaskTemplates.key} = ${row.key}`)
      .get();
    if (oldId !== null && found) {
      remap.templates.set(oldId, found.id);
    }
  }

  // Plant task schedules
  for (const row of t.plantTaskSchedules) {
    const oldId = row.id ?? null;
    const oldPlantId = row.plantId;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    const oldTemplateId = row.templateId ?? null;
    const newTemplateId =
      oldTemplateId === null
        ? null
        : options.remapIds
          ? (remap.templates.get(oldTemplateId) ?? null)
          : oldTemplateId;
    const inserted = db
      .insert(plantTaskSchedules)
      .values({
        plantId: newPlantId,
        templateId: newTemplateId,
        customName: row.customName ?? null,
        intervalDays: row.intervalDays ?? null,
        nextDueAt: getDate(row, "nextDueAt"),
        lastCompletedAt: getDate(row, "lastCompletedAt"),
        snoozedUntil: getDate(row, "snoozedUntil"),
        isEnabled: row.isEnabled ?? true,
        instructions: row.instructions ?? null,
        // Notification IDs are device-bound; clear them so they get re-synced.
        notificationId: null,
        preferredHour: row.preferredHour ?? null,
        preferredMinute: row.preferredMinute ?? null,
      })
      .returning({ id: plantTaskSchedules.id })
      .get();
    if (oldId !== null && inserted) {
      remap.schedules.set(oldId, inserted.id);
    }
  }

  // Care logs
  for (const row of t.careLogs) {
    const oldPlantId = row.plantId;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    const oldScheduleId = row.scheduleId ?? null;
    const oldTemplateId = row.templateId ?? null;
    db.insert(careLogs)
      .values({
        plantId: newPlantId,
        scheduleId:
          oldScheduleId === null
            ? null
            : options.remapIds
              ? (remap.schedules.get(oldScheduleId) ?? null)
              : oldScheduleId,
        templateId:
          oldTemplateId === null
            ? null
            : options.remapIds
              ? (remap.templates.get(oldTemplateId) ?? null)
              : oldTemplateId,
        type: row.type,
        title: row.title ?? null,
        notes: row.notes ?? null,
        completedAt: getDate(row, "completedAt") ?? new Date(),
        amount: row.amount ?? null,
        unit: row.unit ?? null,
      })
      .run();
  }

  // Journal entries
  for (const row of t.journalEntries) {
    const oldPlantId = row.plantId ?? null;
    const newPlantId =
      oldPlantId === null
        ? null
        : options.remapIds
          ? (remap.plants.get(oldPlantId) ?? null)
          : oldPlantId;
    db.insert(journalEntries)
      .values({
        plantId: newPlantId,
        title: row.title ?? null,
        body: row.body,
        mood: row.mood ?? null,
        entryType: row.entryType ?? "note",
        photoUri: resolveImportedPhotoUri(
          row.photoUri,
          options.restoredPhotoUris,
        ),
      })
      .run();
  }

  // Growth measurements
  for (const row of t.growthMeasurements) {
    const oldPlantId = row.plantId;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    db.insert(growthMeasurements)
      .values({
        plantId: newPlantId,
        measuredAt: getDate(row, "measuredAt") ?? new Date(),
        heightCm: row.heightCm ?? null,
        leafCount: row.leafCount ?? null,
        bloomCount: row.bloomCount ?? null,
        notes: row.notes ?? null,
      })
      .run();
  }

  // Health observations
  for (const row of t.healthObservations) {
    const oldPlantId = row.plantId;
    const newPlantId = options.remapIds
      ? (remap.plants.get(oldPlantId) ?? null)
      : oldPlantId;
    if (newPlantId === null) continue;
    db.insert(healthObservations)
      .values({
        plantId: newPlantId,
        observedAt: getDate(row, "observedAt") ?? new Date(),
        issueType: row.issueType,
        severity: row.severity,
        notes: row.notes ?? null,
        status: row.status ?? "active",
      })
      .run();
  }

  // Restore settings + onboarding state on replace import.
  if (!options.remapIds) {
    for (const row of payload.settings) {
      db.insert(appSettings)
        .values({
          key: row.key,
          value: row.value,
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: { value: row.value, updatedAt: new Date() },
        })
        .run();
    }
    for (const row of payload.onboardingState) {
      db.insert(onboardingState)
        .values({
          key: row.key,
          value: row.value,
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: onboardingState.key,
          set: { value: row.value, updatedAt: new Date() },
        })
        .run();
    }
  }
}

function getRowValue(row: object, key: string): unknown {
  return Object.hasOwn(row, key)
    ? (row as Record<string, unknown>)[key]
    : undefined;
}

function getDate(row: object, key: string): Date | null {
  const v = getRowValue(row, key);
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Date(v);
  }
  if (v instanceof Date) return v;
  return null;
}

type RemapResult = {
  rooms: Map<number, number>;
  shelves: Map<number, number>;
  plants: Map<number, number>;
  presets: Map<number, number>;
  templates: Map<number, number>;
  schedules: Map<number, number>;
};

function makeEmptyRemap(): RemapResult {
  return {
    rooms: new Map(),
    shelves: new Map(),
    plants: new Map(),
    presets: new Map(),
    templates: new Map(),
    schedules: new Map(),
  };
}
