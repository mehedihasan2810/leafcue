import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import {
  type PropsWithChildren,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ActivityIndicator, Text, View } from "react-native";

import migrations from "@/drizzle/migrations";
import { createDatabase, DATABASE_NAME, type LeafCueDatabase } from "@/lib/db";
import { runSeeds } from "@/lib/db/seed";

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={<DatabaseStatus message="Opening local database..." />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{ enableChangeListener: true }}
        useSuspense
      >
        <DatabaseMigrationGate>{children}</DatabaseMigrationGate>
      </SQLiteProvider>
    </Suspense>
  );
}

function DatabaseMigrationGate({ children }: PropsWithChildren) {
  const sqlite = useSQLiteContext();
  const db = useMemo(() => createDatabase(sqlite), [sqlite]);
  const { success, error } = useMigrations(db, migrations);
  const seed = useSeed(db, success && !error);

  if (error) {
    return (
      <DatabaseStatus
        message={`Could not prepare the local database: ${error.message}`}
      />
    );
  }

  if (!success) {
    return <DatabaseStatus message="Preparing local database..." />;
  }

  if (seed.status === "running" || seed.status === "idle") {
    return <DatabaseStatus message="Loading plant care library..." />;
  }

  if (seed.status === "error") {
    return (
      <DatabaseStatus
        message={`Could not seed local data: ${seed.error.message}`}
      />
    );
  }

  return children;
}

type SeedState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done" }
  | { status: "error"; error: Error };

function useSeed(db: LeafCueDatabase, ready: boolean): SeedState {
  const [state, setState] = useState<SeedState>({ status: "idle" });

  useEffect(() => {
    if (!ready) return;
    if (state.status !== "idle") return;

    setState({ status: "running" });
    try {
      runSeeds(db);
      setState({ status: "done" });
    } catch (caught) {
      const err = caught instanceof Error ? caught : new Error(String(caught));
      setState({ status: "error", error: err });
    }
  }, [db, ready, state.status]);

  return state;
}

function DatabaseStatus({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background p-6">
      <ActivityIndicator />
      <Text className="text-center text-muted">{message}</Text>
    </View>
  );
}
