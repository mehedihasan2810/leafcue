import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { type PropsWithChildren, Suspense, useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import migrations from "@/drizzle/migrations";
import { createDatabase, DATABASE_NAME } from "@/lib/db";

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

  return children;
}

function DatabaseStatus({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background p-6">
      <ActivityIndicator />
      <Text className="text-center text-muted">{message}</Text>
    </View>
  );
}
