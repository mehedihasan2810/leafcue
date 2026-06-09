# RevenueCat / LeafCue Plus testing

LeafCue Plus billing is powered by [RevenueCat](https://www.revenuecat.com/).
This doc explains how to configure keys, run the Test Store locally, and work
through the manual QA matrix — including offline behavior.

> Billing is optional. With no key set, LeafCue disables billing gracefully:
> the app still boots, works offline, and every free feature works. Only
> creating/reactivating an active plant beyond the free limit is gated.

## Configuration overview

- **Entitlement**: `plus`
- **Offering**: the RevenueCat `current` offering (do not hardcode an offering
  identifier)
- **Packages**: `$rc_monthly`, `$rc_annual`
- **Test products**: `leafcue_monthly`, `leafcue_yearly`
- **Source of truth**: `CustomerInfo.entitlements.active["plus"]` — never a
  local persisted flag.
- RevenueCat is configured **once** in the billing bootstrapper, with an
  **anonymous** user (no custom `appUserID`), and debug logging in `__DEV__`.

All RevenueCat usage is isolated to:

- `lib/billing/*` (constants, SDK wrapper, plant-limit logic)
- `stores/use-entitlements-store.ts`
- `components/billing/billing-bootstrapper.tsx`
- `screens/billing/plus-paywall.tsx`
- `hooks/use-plant-limit-gate.ts`

## Environment variables

Set via Expo public env vars (see `.env.example`):

```bash
# Single fallback key for both platforms (handy for local Test Store testing)
EXPO_PUBLIC_REVENUECAT_API_KEY=

# Production: prefer platform-specific public keys
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
```

Key selection: the iOS build prefers `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, the
Android build prefers `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`, and both fall
back to `EXPO_PUBLIC_REVENUECAT_API_KEY`. Only **public** SDK keys belong in the
client.

> **Never** commit a real key. Put real values in an uncommitted `.env.local`
> (already covered by `.gitignore` via `.env*.local`). **Never** ship a release
> build configured with a Test Store key.

## Local Test Store run

The RevenueCat Test Store works after SDK configuration with a supported SDK
version and lets you exercise purchases without App Store / Play setup.

1. Create `apps/native/.env.local` (uncommitted):

   ```bash
   EXPO_PUBLIC_REVENUECAT_API_KEY=<your test store public key>
   ```

2. Start a development build (Expo Go cannot run real purchases):

   ```bash
   cd apps/native
   pnpm ios     # or: pnpm android
   ```

   or from the repo root with an inline key:

   ```bash
   EXPO_PUBLIC_REVENUECAT_API_KEY=<key> pnpm --filter @leafcue/native ios
   ```

## Development build required

A **development build** (`expo-dev-client`) or EAS build is required for real
purchase testing. Expo Go can preview the paywall UI and gating logic but cannot
complete store purchases.

## Manual test matrix

| # | Scenario | Expected |
|---|----------|----------|
| 1 | No key set | App boots; free flows work; Settings → Plus shows a calm unavailable/try-again state, no crash |
| 2 | Test Store key set | `current` offering loads; monthly + yearly cards show RevenueCat prices (not hardcoded) |
| 3 | < 20 active plants | Adding a plant never shows the paywall |
| 4 | 20 active plants | Plant #21 shows the paywall; plant is not created |
| 5 | Purchase | `plus` becomes active; paywall closes; plant #21 creatable; Settings shows Plus |
| 6 | Restore | Only on user tap; updates Plus state |
| 7 | Offline, no cached Plus, at limit | Offline dialog (not broken paywall); no plant created |
| 8 | Offline, cached Plus active | Gated action allowed from cached entitlement |
| 9 | Plus inactive, 30 active plants | Existing data visible/editable/exportable; new active plants blocked; archiving allowed |
| 10 | Unarchive over limit, no Plus | Plus gate shown; archiving never blocked |
| 11 | Light/dark | Paywall polished and readable in both; long prices don't clip |
| 12 | Accessibility | Buttons labeled; plan cards announce selection; restore/continue/close reachable |

## Offline test steps

1. Launch online with the Test Store key and confirm offerings load.
2. (Optional) Purchase Plus and confirm it is active.
3. Enable airplane mode.
4. Cold-launch the app:
   - Cached `CustomerInfo` should still report Plus active if previously
     purchased → gated actions remain allowed.
   - With no cached Plus and at the limit → the gate shows the offline dialog,
     and the paywall (if opened) shows the calm offline state with **Try
     again**, **Restore purchases**, and **Continue free**, never empty price
     cards.
5. Confirm core local flows (view/edit plants, logs, tasks, journal, photos,
   export, archiving) are never blocked while offline.

## Reminders

- Never commit the Test Store key (or any key) to source control.
- Never submit a release build configured with the Test Store key.
- Do not call `restorePurchases()` automatically — only on a user tap.
- Do not call `logOut()` for anonymous users; it clears the RevenueCat cache.
