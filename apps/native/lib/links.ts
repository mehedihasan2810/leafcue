import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

/** Public LeafCue web + contact links (the marketing site at leafcue.galaxyway.ai). */
export const LINKS = {
  website: "https://leafcue.galaxyway.ai",
  privacy: "https://leafcue.galaxyway.ai/privacy",
  terms: "https://leafcue.galaxyway.ai/terms",
  support: "https://leafcue.galaxyway.ai/support",
  contactEmail: "info@galaxyway.ai",
  company: "GALAXYWAY AI LTD",
} as const;

/** Open an external URL in the in-app browser. */
export function openExternal(url: string) {
  return WebBrowser.openBrowserAsync(url);
}

/** Open the system mail composer to the given address. */
export function openEmail(email: string) {
  return Linking.openURL(`mailto:${email}`);
}
