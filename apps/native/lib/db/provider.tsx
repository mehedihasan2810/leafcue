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
import {
  configureNotificationHandler,
  syncAllReminders,
} from "@/lib/notifications";
import { useReminderStore } from "@/stores/use-reminder-store";
import { useThemeStore } from "@/stores/use-theme-store";

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

  useNotificationsBoot(db, seed.status === "done");

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

function useNotificationsBoot(db: LeafCueDatabase, ready: boolean): void {
  const hydrate = useReminderStore((state) => state.hydrate);
  const hydrateAppearance = useThemeStore((state) => state.hydrateAppearance);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    configureNotificationHandler();
    // Sync appearance preference into Uniwind so dark mode persists.
    hydrateAppearance(db);

    const boot = async () => {
      try {
        await hydrate(db);
        if (cancelled) return;
        const settings = useReminderStore.getState().settings;
        const permissionStatus = useReminderStore.getState().permissionStatus;
        if (settings.enabled && permissionStatus === "granted") {
          await syncAllReminders(db);
        }
      } catch {
        // Notifications boot is best-effort; ignore failures so the app still loads.
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [db, ready, hydrate, hydrateAppearance]);
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
    const timer = setImmediate(() => {
      try {
        runSeeds(db);
        setState({ status: "done" });
      } catch (caught) {
        const err =
          caught instanceof Error ? caught : new Error(String(caught));
        setState({ status: "error", error: err });
      }
    });
    return () => clearImmediate(timer);
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
