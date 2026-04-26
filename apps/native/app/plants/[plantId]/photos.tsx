import { useLocalSearchParams } from "expo-router";

import { plantRouteParamsSchema } from "@/lib/db/zod";
import { PlantPhotosScreen } from "@/screens/plants/photos";

export default function PlantPhotosRoute() {
  const params = useLocalSearchParams();
  const parsed = plantRouteParamsSchema.safeParse(params);
  if (!parsed.success) return null;
  return <PlantPhotosScreen plantId={parsed.data.plantId} />;
}
