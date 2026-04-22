import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import migrations from "@/lib/watermelon/migrations";
import schema from "@/lib/watermelon/schema";

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: "adhd_app",
  jsi: true,
  onSetUpError: (error) => {
    console.error("[WatermelonDB] Database setup failed", error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [],
});
