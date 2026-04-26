import { create } from "zustand";

import type { TaskFilter } from "@/lib/db/zod";

type TaskFiltersStore = {
  filter: TaskFilter;
  setFilter: (filter: TaskFilter) => void;
};

export const useTaskFiltersStore = create<TaskFiltersStore>((set) => ({
  filter: "today",
  setFilter: (filter) => set({ filter }),
}));
