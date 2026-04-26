import { useLocalSearchParams } from "expo-router";

import { plantRouteParamsSchema } from "@/lib/db/zod";
import { SchedulesScreen } from "@/screens/plants/schedules";

export default function PlantSchedulesRoute() {
  const params = useLocalSearchParams();
  const parsed = plantRouteParamsSchema.safeParse(params);
  if (!parsed.success) return null;
  return <SchedulesScreen plantId={parsed.data.plantId} />;
}
