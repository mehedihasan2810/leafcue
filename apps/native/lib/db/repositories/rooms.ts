import { asc, eq } from "drizzle-orm";

import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { rooms, shelves } from "@/lib/db/schema";
import type { Room, Shelf } from "@/lib/db/types";
import {
  roomInsertSchema,
  type RoomInsertInput,
  shelfInsertSchema,
  type ShelfInsertInput,
} from "@/lib/db/zod";

export function getRooms(db: LeafCueDbOrTx): Room[] {
  return db
    .select()
    .from(rooms)
    .orderBy(asc(rooms.sortOrder), asc(rooms.name))
    .all();
}

export function getRoomById(
  db: LeafCueDbOrTx,
  id: number,
): Room | undefined {
  return db.select().from(rooms).where(eq(rooms.id, id)).get();
}

export function createRoom(
  db: LeafCueDatabase,
  input: RoomInsertInput,
): Room {
  const parsed = roomInsertSchema.parse(input);
  const now = new Date();

  const inserted = db
    .insert(rooms)
    .values({
      name: parsed.name,
      icon: parsed.icon ?? null,
      sortOrder: parsed.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!inserted) {
    throw new Error("Failed to create room");
  }

  return inserted;
}

export function updateRoom(
  db: LeafCueDatabase,
  id: number,
  input: Partial<RoomInsertInput>,
): Room {
  const parsed = roomInsertSchema.partial().parse(input);
  const updated = db
    .update(rooms)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(rooms.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new Error(`Room ${id} not found`);
  }

  return updated;
}

export function deleteRoom(db: LeafCueDatabase, id: number): void {
  db.delete(rooms).where(eq(rooms.id, id)).run();
}

export function getShelves(
  db: LeafCueDbOrTx,
  roomId?: number,
): Shelf[] {
  const where = roomId !== undefined ? eq(shelves.roomId, roomId) : undefined;
  return db
    .select()
    .from(shelves)
    .where(where)
    .orderBy(asc(shelves.sortOrder), asc(shelves.name))
    .all();
}

export function createShelf(
  db: LeafCueDatabase,
  input: ShelfInsertInput,
): Shelf {
  const parsed = shelfInsertSchema.parse(input);
  const now = new Date();

  const inserted = db
    .insert(shelves)
    .values({
      roomId: parsed.roomId,
      name: parsed.name,
      icon: parsed.icon ?? null,
      sortOrder: parsed.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!inserted) {
    throw new Error("Failed to create shelf");
  }

  return inserted;
}

export function deleteShelf(db: LeafCueDatabase, id: number): void {
  db.delete(shelves).where(eq(shelves.id, id)).run();
}
