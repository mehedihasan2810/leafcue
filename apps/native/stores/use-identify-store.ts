import { create } from "zustand";

/** A confirmed identification, handed back to whichever add-plant flow opened it. */
export type IdentifyPick = {
  presetId: number | null;
  commonName: string;
  scientificName: string | null;
  photoUri: string | null;
};

type IdentifyStore = {
  pick: IdentifyPick | null;
  setPick: (pick: IdentifyPick) => void;
  clear: () => void;
};

export const useIdentifyStore = create<IdentifyStore>((set) => ({
  pick: null,
  setPick: (pick) => set({ pick }),
  clear: () => set({ pick: null }),
}));
