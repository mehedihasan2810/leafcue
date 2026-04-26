import { useLocalSearchParams } from "expo-router";

import { plantRouteParamsSchema } from "@/lib/db/zod";
import { PlantHealthScreen } from "@/screens/plants/health";

export default function PlantHealthRoute() {
  const params = useLocalSearchParams();
  const parsed = plantRouteParamsSchema.safeParse(params);
  if (!parsed.success) return null;
  return <PlantHealthScreen plantId={parsed.data.plantId} />;
}
