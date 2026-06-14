import type { PlantPreset } from "@/lib/db/types";

/** A single ranked identification guess for a photographed plant. */
export type IdentifySuggestion = {
  commonName: string;
  scientificName: string | null;
  /** 0–1 model confidence. */
  confidence: number;
  /** Matched built-in preset, when the species is known to LeafCue. */
  presetId: number | null;
  /** Care fields to prefill, derived from the matched preset. */
  careHints: PlantPreset | null;
};

export type IdentifierKind = "null" | "stub" | "remote";

/**
 * Pluggable plant identifier. The whole point of this boundary is that the core
 * app never depends on the network: when no provider is configured (or the user
 * has not opted in), the NullIdentifier is used and every entry point hides.
 */
export interface PlantIdentifier {
  readonly kind: IdentifierKind;
  isAvailable(): boolean;
  identify(imageUri: string): Promise<IdentifySuggestion[]>;
}
