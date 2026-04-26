import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import {
  type SQLiteDatabase,
  type SQLiteRunResult,
  useSQLiteContext,
} from "expo-sqlite";

import * as schema from "@/lib/db/schema";

export const DATABASE_NAME = "leafcue.db";

export type LeafCueSchema = typeof schema;

export type LeafCueDatabase = ExpoSQLiteDatabase<LeafCueSchema>;

export type LeafCueTransaction = SQLiteTransaction<
  "sync",
  SQLiteRunResult,
  LeafCueSchema,
  ExtractTablesWithRelations<LeafCueSchema>
>;

export type LeafCueDbOrTx = LeafCueDatabase | LeafCueTransaction;

export function createDatabase(sqlite: SQLiteDatabase): LeafCueDatabase {
  return drizzle(sqlite, { schema });
}

export function useDatabase(): LeafCueDatabase {
  return createDatabase(useSQLiteContext());
}
