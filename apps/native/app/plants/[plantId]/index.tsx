import { useLocalSearchParams } from "expo-router";

import { plantRouteParamsSchema } from "@/lib/db/zod";
import { PlantDetailScreen } from "@/screens/plants/detail";

export default function PlantDetailRoute() {
  const params = useLocalSearchParams();
  const parsed = plantRouteParamsSchema.safeParse(params);
  if (!parsed.success) return null;
  return <PlantDetailScreen plantId={parsed.data.plantId} />;
}
