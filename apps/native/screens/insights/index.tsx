import { format } from "date-fns";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { getHealthIssueLabel } from "@/lib/care/health-hints";
import { useDatabase } from "@/lib/db";
import { getInsightsSummary } from "@/lib/db/repositories";
import {
  careLogs,
  growthMeasurements,
  healthObservations,
  plants,
  plantTaskSchedules,
} from "@/lib/db/schema";

import { ConsistencyCard } from "@/screens/insights/_components/consistency-card";
import { InsightsCard } from "@/screens/insights/_components/insights-card";
import { PlantRow } from "@/screens/insights/_components/plant-row";
import { StreakCard } from "@/screens/insights/_components/streak-card";

export function InsightsScreen() {
  const db = useDatabase();

  const livePlants = useLiveQuery(db.select().from(plants));
  const liveSchedules = useLiveQuery(db.select().from(plantTaskSchedules));
  const liveLogs = useLiveQuery(db.select().from(careLogs));
  const liveGrowth = useLiveQuery(db.select().from(growthMeasurements));
  const liveHealth = useLiveQuery(db.select().from(healthObservations));

  const summary = useMemo(
    () => getInsightsSummary(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      db,
      livePlants.data.length,
      liveSchedules.data.length,
      liveLogs.data.length,
      liveGrowth.data.length,
      liveHealth.data.length,
    ],
  );

  const goToPlant = (plantId: number) => {
    router.push({
      pathname: "/plants/[plantId]",
      params: { plantId: String(plantId) },
    });
  };

  const goToHealth = (plantId: number) => {
    router.push({
      pathname: "/plants/[plantId]/health",
      params: { plantId: String(plantId) },
    });
  };

  const goToGrowth = (plantId: number) => {
    router.push({
      pathname: "/plants/[plantId]/growth",
      params: { plantId: String(plantId) },
    });
  };

  if (summary.totalPlants === 0) {
    return (
      <Container className="px-6" isScrollable>
        <View className="gap-6 pt-2">
          <Header />
          <EmptyState
            icon="bar-chart-outline"
            title="Insights show up here"
            description="Add plants and start logging care to see streaks, consistency, and what needs attention."
            ctaLabel="Add a plant"
            onPressCta={() => router.push("/plants/new")}
          />
        </View>
      </Container>
    );
  }

  return (
    <Container className="px-6" isScrollable>
      <View className="gap-4 pt-2 pb-8">
        <Header />
        <StreakCard days={summary.careStreakDays} />
        <ConsistencyCard consistency={summary.wateringConsistency} />

        {summary.mostCaredForPlants.length > 0 ? (
          <InsightsCard
            title="Most cared-for"
            description="Top plants by logged care actions in the last 90 days."
          >
            {summary.mostCaredForPlants.map((row) => (
              <PlantRow
                key={`mostcared-${row.plant.id}`}
                plant={row.plant}
                caption="Care actions"
                trailingValue={String(row.count)}
                onPress={() => goToPlant(row.plant.id)}
              />
            ))}
          </InsightsCard>
        ) : null}

        {summary.mostOverdueRightNow.length > 0 ? (
          <InsightsCard
            title="Most overdue right now"
            description="Plants with multiple overdue cues."
          >
            {summary.mostOverdueRightNow.map((row) => (
              <PlantRow
                key={`overdue-${row.plant.id}`}
                plant={row.plant}
                caption="Overdue tasks"
                trailingValue={String(row.count)}
                onPress={() => goToPlant(row.plant.id)}
              />
            ))}
          </InsightsCard>
        ) : null}

        {summary.recentGrowthMilestones.length > 0 ? (
          <InsightsCard
            title="Recent growth milestones"
            description="Notes and measurements from the last 30 days."
          >
            {summary.recentGrowthMilestones.map((row) => (
              <PlantRow
                key={`growth-${row.measurement.id}`}
                plant={row.plant}
                caption={
                  row.measurement.notes
                    ? row.measurement.notes
                    : row.measurement.heightCm !== null
                      ? `${row.measurement.heightCm} cm`
                      : "New measurement"
                }
                trailingValue={format(row.measurement.measuredAt, "MMM d")}
                onPress={() => goToGrowth(row.plant.id)}
              />
            ))}
          </InsightsCard>
        ) : null}

        {summary.plantsWithActiveIssues.length > 0 ? (
          <InsightsCard
            title="Active health issues"
            description="Open observations across your plants."
          >
            {summary.plantsWithActiveIssues.map((row) => (
              <PlantRow
                key={`issue-${row.observation.id}`}
                plant={row.plant}
                caption={getHealthIssueLabel(row.observation.issueType)}
                trailingValue={row.observation.severity}
                onPress={() => goToHealth(row.plant.id)}
              />
            ))}
          </InsightsCard>
        ) : null}

        {summary.recentlyNeglectedPlants.length > 0 ? (
          <InsightsCard
            title="Could use attention"
            description="No care actions logged in the last 14 days."
          >
            {summary.recentlyNeglectedPlants.map((plant) => (
              <PlantRow
                key={`neglected-${plant.id}`}
                plant={plant}
                caption="Hasn't been logged recently"
                onPress={() => goToPlant(plant.id)}
              />
            ))}
          </InsightsCard>
        ) : null}
      </View>
    </Container>
  );
}

function Header() {
  return (
    <View className="gap-1">
      <Text className="text-muted text-sm">Trends and patterns</Text>
      <Text className="font-bold text-3xl text-foreground">Insights</Text>
    </View>
  );
}
