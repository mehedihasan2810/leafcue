import type { RoomInsertInput } from "@/lib/db/zod";

export const defaultRoomSeeds: ReadonlyArray<RoomInsertInput> = [
  { name: "Living Room", icon: "tv-outline", sortOrder: 0 },
  { name: "Bedroom", icon: "bed-outline", sortOrder: 1 },
  { name: "Kitchen", icon: "restaurant-outline", sortOrder: 2 },
  { name: "Balcony", icon: "sunny-outline", sortOrder: 3 },
  { name: "Office", icon: "laptop-outline", sortOrder: 4 },
];
