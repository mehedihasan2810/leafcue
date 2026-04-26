import { useLocalSearchParams } from "expo-router";

import { plantRouteParamsSchema } from "@/lib/db/zod";
import { PlantGrowthScreen } from "@/screens/plants/growth";

export default function PlantGrowthRoute() {
  const params = useLocalSearchParams();
  const parsed = plantRouteParamsSchema.safeParse(params);
  if (!parsed.success) return null;
  return <PlantGrowthScreen plantId={parsed.data.plantId} />;
}
