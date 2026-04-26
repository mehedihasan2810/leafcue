import { useLocalSearchParams } from "expo-router";

import { plantRouteParamsSchema } from "@/lib/db/zod";
import { PlantJournalScreen } from "@/screens/plants/journal";

export default function PlantJournalRoute() {
  const params = useLocalSearchParams();
  const parsed = plantRouteParamsSchema.safeParse(params);
  if (!parsed.success) return null;
  return <PlantJournalScreen plantId={parsed.data.plantId} />;
}
