import { desc, eq } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import type { JournalEntry } from "@/lib/db/types";
import {
  type JournalEntryInsertInput,
  journalEntryInsertSchema,
} from "@/lib/db/zod";
import { deletePersistedPhoto } from "@/lib/photos";

export function getJournalEntriesForPlant(
  db: LeafCueDbOrTx,
  plantId: number,
): JournalEntry[] {
  return db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.plantId, plantId))
    .orderBy(desc(journalEntries.createdAt))
    .all();
}

export function getRecentJournalEntries(
  db: LeafCueDbOrTx,
  limit = 20,
): JournalEntry[] {
  return db
    .select()
    .from(journalEntries)
    .orderBy(desc(journalEntries.createdAt))
    .limit(limit)
    .all();
}

export function createJournalEntry(
  db: LeafCueDatabase,
  input: JournalEntryInsertInput,
): JournalEntry {
  const parsed = journalEntryInsertSchema.parse(input);
  const now = new Date();

  return db.transaction((tx) => {
    const inserted = tx
      .insert(journalEntries)
      .values({
        plantId: parsed.plantId ?? null,
        title: parsed.title ?? null,
        body: parsed.body,
        mood: parsed.mood ?? null,
        entryType: parsed.entryType ?? "note",
        photoUri: parsed.photoUri ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    if (!inserted) {
      throw new Error("Failed to create journal entry");
    }

    return inserted;
  });
}

export function updateJournalEntry(
  db: LeafCueDatabase,
  id: number,
  input: Partial<JournalEntryInsertInput>,
): JournalEntry {
  const parsed = journalEntryInsertSchema.partial().parse(input);

  return db.transaction((tx) => {
    const previous = tx
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.id, id))
      .get();

    if (!previous) {
      throw new Error(`Journal entry ${id} not found`);
    }

    const updated = tx
      .update(journalEntries)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(journalEntries.id, id))
      .returning()
      .get();

    if (!updated) {
      throw new Error(`Journal entry ${id} not found`);
    }

    if (
      Object.hasOwn(parsed, "photoUri") &&
      previous.photoUri &&
      previous.photoUri !== updated.photoUri
    ) {
      deletePersistedPhoto(previous.photoUri);
    }

    return updated;
  });
}

export function deleteJournalEntry(db: LeafCueDatabase, id: number): void {
  db.transaction((tx) => {
    const previous = tx
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.id, id))
      .get();

    tx.delete(journalEntries).where(eq(journalEntries.id, id)).run();

    if (previous?.photoUri) {
      deletePersistedPhoto(previous.photoUri);
    }
  });
}
