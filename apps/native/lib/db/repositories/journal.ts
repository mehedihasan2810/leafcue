import { desc, eq } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import type { JournalEntry } from "@/lib/db/types";
import {
  type JournalEntryInsertInput,
  journalEntryInsertSchema,
} from "@/lib/db/zod";

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

  const inserted = db
    .insert(journalEntries)
    .values({
      plantId: parsed.plantId ?? null,
      title: parsed.title ?? null,
      body: parsed.body,
      mood: parsed.mood ?? null,
      entryType: parsed.entryType ?? "note",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!inserted) {
    throw new Error("Failed to create journal entry");
  }

  return inserted;
}

export function updateJournalEntry(
  db: LeafCueDatabase,
  id: number,
  input: Partial<JournalEntryInsertInput>,
): JournalEntry {
  const parsed = journalEntryInsertSchema.partial().parse(input);
  const updated = db
    .update(journalEntries)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(journalEntries.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new Error(`Journal entry ${id} not found`);
  }

  return updated;
}

export function deleteJournalEntry(db: LeafCueDatabase, id: number): void {
  db.delete(journalEntries).where(eq(journalEntries.id, id)).run();
}
