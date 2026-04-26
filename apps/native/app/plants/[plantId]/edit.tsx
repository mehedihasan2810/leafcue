import { useLocalSearchParams } from "expo-router";
import { plantRouteParamsSchema } from "@/lib/db/zod";
import { EditPlantScreen } from "@/screens/plants/edit";

export default function EditPlantRoute() {
  const params = useLocalSearchParams();
  const parsed = plantRouteParamsSchema.safeParse(params);
  const plantId = parsed.success ? parsed.data.plantId : undefined;

  return <EditPlantScreen mode="edit" plantId={plantId} />;
}
