/**
 * Single source of truth for LeafCue marketing-site constants.
 *
 * STORE LINKS: the App Store URL is a PLACEHOLDER until the listing is live —
 * swap `APP_STORE_URL` for the real `https://apps.apple.com/app/idXXXXXXXXX` link.
 * The Play Store URL uses the real package id and should resolve once published.
 */

export const SITE = {
  name: "LeafCue",
  tagline: "Quiet care for growing things.",
  description:
    "LeafCue is a calm, private, offline-first plant care tracker. See what each plant needs today, get gentle reminders, and keep every note on your device — no account required.",
  url: "https://leafcue.galaxyway.ai",
  company: "GALAXYWAY AI LTD",
  contactEmail: "info@galaxyway.ai",
  // App Store listing not yet published — clearly-marked placeholder.
  appStoreUrl: "https://apps.apple.com/app/leafcue/id0000000000",
  // Real package id; resolves once the Play listing is live.
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=com.galaxywayai.leafcue",
} as const;

export const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Privacy", href: "/#privacy" },
  { label: "FAQ", href: "/#faq" },
] as const;
