import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { type SQLiteDatabase, useSQLiteContext } from "expo-sqlite";

import * as schema from "@/lib/db/schema";

export const DATABASE_NAME = "leafcue.db";

export type LeafCueDatabase = ExpoSQLiteDatabase<typeof schema>;

export function createDatabase(sqlite: SQLiteDatabase): LeafCueDatabase {
  return drizzle(sqlite, { schema });
}

export function useDatabase(): LeafCueDatabase {
  return createDatabase(useSQLiteContext());
}
