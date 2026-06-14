import { create } from "zustand";

/**
 * A tiny pulse store: each `celebrate()` bumps the nonce, which the root-mounted
 * <CompletionCelebration /> overlay watches to play a brief flourish.
 */
type CelebrationStore = {
  nonce: number;
  celebrate: () => void;
};

export const useCelebrationStore = create<CelebrationStore>((set) => ({
  nonce: 0,
  celebrate: () => set((state) => ({ nonce: state.nonce + 1 })),
}));
