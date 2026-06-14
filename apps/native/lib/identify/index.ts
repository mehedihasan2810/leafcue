import type { LeafCueDatabase, LeafCueDbOrTx } from "@/lib/db";
import { getPresets } from "@/lib/db/repositories";
import type { PlantPreset } from "@/lib/db/types";
import { readPhotoAsBase64 } from "@/lib/photos";
import { loadAppPreferences } from "@/lib/settings/app-settings";

import type { IdentifySuggestion, PlantIdentifier } from "./types";

export * from "./types";

/** The proxy URL that fronts a vision provider (Plant.id / PlantNet). */
function getIdentifyEndpoint(): string | null {
  const url = process.env.EXPO_PUBLIC_PLANT_ID_ENDPOINT;
  return url && url.trim().length > 0 ? url.trim() : null;
}

/**
 * In dev we allow a canned stub so the whole flow is testable before a real
 * vision provider is wired up. Production builds without an endpoint stay dark.
 */
const STUB_ALLOWED = __DEV__;

/** Best-effort match of an identified species to a built-in preset. */
function matchPreset(
  db: LeafCueDbOrTx,
  commonName: string,
  scientificName: string | null,
): PlantPreset | null {
  const presets = getPresets(db);
  const norm = (value: string) => value.trim().toLowerCase();
  const cn = norm(commonName);
  const sn = scientificName ? norm(scientificName) : null;
  const byScientific = sn
    ? presets.find((p) => p.scientificName && norm(p.scientificName) === sn)
    : undefined;
  return (
    byScientific ??
    presets.find((p) => norm(p.commonName) === cn) ??
    presets.find(
      (p) => norm(p.commonName).includes(cn) || cn.includes(norm(p.commonName)),
    ) ??
    null
  );
}

const NULL_IDENTIFIER: PlantIdentifier = {
  kind: "null",
  isAvailable: () => false,
  identify: async () => [],
};

const STUB_GUESS_NAMES = ["Monstera", "Pothos", "Snake Plant"] as const;
const STUB_CONFIDENCE = [0.86, 0.72, 0.61] as const;

function createStubIdentifier(db: LeafCueDatabase): PlantIdentifier {
  return {
    kind: "stub",
    isAvailable: () => true,
    identify: async () => {
      const presets = getPresets(db);
      return STUB_GUESS_NAMES.flatMap((name, index): IdentifySuggestion[] => {
        const preset = presets.find((p) => p.commonName === name);
        if (!preset) return [];
        return [
          {
            commonName: preset.commonName,
            scientificName: preset.scientificName,
            confidence: STUB_CONFIDENCE[index] ?? 0.5,
            presetId: preset.id,
            careHints: preset,
          },
        ];
      });
    },
  };
}

type RemoteSuggestion = {
  commonName?: string;
  scientificName?: string | null;
  confidence?: number;
};

/**
 * Real identifier. Sends one base64 photo to the proxy, which holds the
 * provider API key and rate-limits. Expected contract:
 *   POST endpoint  { image: <base64> }
 *   → 200          { suggestions: [{ commonName, scientificName?, confidence? }] }
 */
function createRemoteIdentifier(
  db: LeafCueDatabase,
  endpoint: string,
): PlantIdentifier {
  return {
    kind: "remote",
    isAvailable: () => true,
    identify: async (imageUri) => {
      const photo = readPhotoAsBase64(imageUri);
      if (!photo) {
        throw new Error("Could not read the selected photo.");
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo.base64, mimeType: photo.mimeType }),
      });
      if (!response.ok) {
        throw new Error(`Identification failed (${response.status}).`);
      }
      const payload = (await response.json()) as {
        suggestions?: RemoteSuggestion[];
      };
      return (payload.suggestions ?? []).flatMap(
        (item): IdentifySuggestion[] => {
          if (!item.commonName) return [];
          const preset = matchPreset(
            db,
            item.commonName,
            item.scientificName ?? null,
          );
          return [
            {
              commonName: item.commonName,
              scientificName:
                item.scientificName ?? preset?.scientificName ?? null,
              confidence:
                typeof item.confidence === "number" ? item.confidence : 0.5,
              presetId: preset?.id ?? null,
              careHints: preset ?? null,
            },
          ];
        },
      );
    },
  };
}

/**
 * Whether any identification provider exists (a configured proxy, or the dev
 * stub). Drives whether the "Identify by photo" entry points appear at all.
 */
export function isIdentifyConfigurable(): boolean {
  return getIdentifyEndpoint() !== null || STUB_ALLOWED;
}

/**
 * Resolve the active identifier, honoring the user's opt-in. Returns the
 * NullIdentifier (isAvailable=false) whenever the feature is off or no provider
 * is configured, so the rest of the app stays fully offline by default.
 */
export function getIdentifier(db: LeafCueDatabase): PlantIdentifier {
  const prefs = loadAppPreferences(db);
  if (!prefs.identifyEnabled) return NULL_IDENTIFIER;
  const endpoint = getIdentifyEndpoint();
  if (endpoint) return createRemoteIdentifier(db, endpoint);
  if (STUB_ALLOWED) return createStubIdentifier(db);
  return NULL_IDENTIFIER;
}
