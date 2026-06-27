/**
 * Single source of truth for LeafCue marketing-site constants.
 *
 * STORE LINKS: both listings are live — the App Store link uses the published
 * app id (6778321045) and the Play Store link uses the real package id.
 */

export const SITE = {
  name: "LeafCue",
  tagline: "Quiet care for growing things.",
  description:
    "LeafCue is a calm, private, offline-first plant care tracker. See what each plant needs today, get gentle reminders, and keep every note on your device — no account required.",
  url: "https://leafcue.galaxyway.ai",
  company: "GALAXYWAY AI LTD",
  contactEmail: "info@galaxyway.ai",
  // Live App Store listing.
  appStoreUrl: "https://apps.apple.com/app/leafcue/id6778321045",
  // Live Play Store listing.
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=com.galaxywayai.leafcue",
} as const;

export const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Privacy", href: "/#privacy" },
  { label: "FAQ", href: "/#faq" },
] as const;
