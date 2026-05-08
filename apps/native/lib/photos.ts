import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

import {
  MAX_BACKUP_PHOTO_BASE64_CHARS,
  MAX_BACKUP_PHOTO_BYTES,
} from "@/lib/backup/limits";

export const PHOTO_DIR_NAME = "plant-photos";
export type SupportedPhotoMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "image/heic"
  | "image/heif";

const SUPPORTED_PHOTO_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "heic",
  "heif",
]);

export function ensurePhotoDir(): Directory {
  const dir = new Directory(Paths.document, PHOTO_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function inferExtension(uri: string): string {
  const queryStripped = uri.split("?")[0] ?? uri;
  const match = queryStripped.match(/\.([a-zA-Z0-9]+)$/);
  if (!match?.[1]) return "jpg";
  const extension = match[1].toLowerCase();
  return SUPPORTED_PHOTO_EXTENSIONS.has(extension) ? extension : "jpg";
}

export function persistPickedPhoto(sourceUri: string): string {
  const dir = ensurePhotoDir();
  const extension = inferExtension(sourceUri);
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;
  const destination = new File(dir, filename);
  const source = new File(sourceUri);
  source.copy(destination);
  return destination.uri;
}

export function deletePersistedPhoto(uri: string | null | undefined): void {
  if (!uri) return;
  if (!uri.includes(`/${PHOTO_DIR_NAME}/`)) return;
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // best-effort cleanup
  }
}

export type PickPhotoSource = "library" | "camera";

export type PickPhotoResult =
  | { canceled: true }
  | { canceled: false; uri: string };

export async function pickPlantPhoto(
  source: PickPhotoSource,
): Promise<PickPhotoResult> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  };

  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return { canceled: true };
    }
    const result = await ImagePicker.launchCameraAsync(options);
    return resolveResult(result);
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { canceled: true };
  }
  const result = await ImagePicker.launchImageLibraryAsync(options);
  return resolveResult(result);
}

function resolveResult(result: ImagePicker.ImagePickerResult): PickPhotoResult {
  if (result.canceled || !result.assets[0]) {
    return { canceled: true };
  }
  const persistedUri = persistPickedPhoto(result.assets[0].uri);
  return { canceled: false, uri: persistedUri };
}

/** Read a persisted photo file and return its base64-encoded content + mime type. */
export function readPhotoAsBase64(
  uri: string,
): { base64: string; mimeType: SupportedPhotoMimeType } | null {
  try {
    const file = new File(uri);
    if (!file.exists) return null;
    if (file.size > MAX_BACKUP_PHOTO_BYTES) return null;
    const extension = inferExtension(uri);
    const mimeType = mimeFromExtension(extension);
    const base64 = file.base64Sync();
    return { base64, mimeType };
  } catch {
    return null;
  }
}

/** Write a base64-encoded photo to a file. */
export function writePhotoBase64(file: File, base64Data: string): void {
  if (base64Data.length > MAX_BACKUP_PHOTO_BASE64_CHARS) {
    throw new Error("Photo file is too large to restore.");
  }
  file.write(base64Data, { encoding: "base64" });
}

/** Infer a MIME type from a file extension. */
function mimeFromExtension(ext: string): SupportedPhotoMimeType {
  const map: Record<string, SupportedPhotoMimeType> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
  };
  return map[ext.toLowerCase()] ?? "image/jpeg";
}
