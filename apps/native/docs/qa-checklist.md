# LeafCue Native QA Checklist

Run through these scenarios before tagging a release. Most flows assume an
EAS development build or production build of `apps/native`.

## First-run / install

- [ ] Fresh install on a clean simulator/device launches into onboarding.
- [ ] Onboarding completes without granting notification permission.
- [ ] Onboarding completes again on a second device with a different time zone.
- [ ] App boots offline (airplane mode) without errors and reaches Today.

## Plants

- [ ] Add the first plant manually with only a nickname and watering interval.
- [ ] Add a plant from a preset; care defaults from the preset are populated.
- [ ] Edit a plant's nickname, room, shelf, and notes.
- [ ] Add a cover photo from the photo library and from the camera.
- [ ] Mark a plant as a favorite from the detail screen.
- [ ] Archive a plant; it disappears from Today, Tasks, and the Plants list.
- [ ] Open Settings → Archive to unarchive the plant; it returns everywhere.
- [ ] Open Settings → Archive to permanently delete; cascades to logs/photos.

## Care tasks

- [ ] Complete a task on Today; the next due date advances.
- [ ] Snooze a task by N days; it reappears on the new date.
- [ ] Mark a task as completed for an earlier date; the streak math is correct.
- [ ] Disable a schedule; it stops appearing in Today/Tasks.
- [ ] Re-enable the same schedule and confirm the next-due recalculates.

## Local notifications

- [ ] Toggle reminders on; iOS prompts for notification permission.
- [ ] Receive a daily summary at the configured reminder time.
- [ ] Quiet hours suppress notifications during the configured window.
- [ ] Switch preview style to Discreet; lock-screen text is generic.
- [ ] Disable reminders; no further notifications fire.

## Journal, photos, growth, health

- [ ] Add a journal entry with body, mood, and an optional photo.
- [ ] Add a photo from gallery and from camera; tagged correctly.
- [ ] Add a growth measurement with height/leaf count/bloom count/notes.
- [ ] Add a health observation with severity and an optional treatment plan.
- [ ] Mark a health issue as improving, then resolved.

## Settings hub

- [ ] `/settings` lists Personalization, Reminders, Data & privacy, About.
- [ ] Appearance: Light / Dark / System options persist after restart.
- [ ] App preferences: week start day and units persist after restart.
- [ ] Plant defaults: empty + invalid + valid intervals are validated.
- [ ] Reminders: see Local notifications section above.
- [ ] About: shows version string from `app.json`.
- [ ] Privacy: contains the local-first explanation.

## Backup, export, import

- [ ] Export backup; share sheet opens; resulting file ends with `.json`.
- [ ] Inspect the file; it contains `version: 1`, `tables`, and
      `photoPolicy.includesPhotoFiles: false`.
- [ ] Import that same file via Merge: plant data appears with new IDs;
      existing plants are not deleted; current settings are preserved.
- [ ] Import that same file via Replace: confirm destructive dialog; after
      replace, all plant data and settings come from the backup.
- [ ] Edit the JSON to invalidate the schema; import shows a clear error.
- [ ] Import on a fresh install; preview counts match the backup contents.
- [ ] Verify reminders re-sync automatically after Replace import.
- [ ] Verify photo URIs that no longer exist on disk are skipped silently;
      no broken plant rows are created.

## Theme + dark mode

- [ ] Enter dark mode via Appearance setting; every screen renders correctly.
- [ ] Switch to System; toggling OS theme updates the app live.
- [ ] Onboarding screens render correctly in dark mode.

## Empty + edge states

- [ ] Today, Tasks, Calendar, Plants, Insights, Rooms, and Journal each show
      a tasteful empty state when no data exists.
- [ ] Add 30+ plants and 200+ care logs; lists scroll smoothly.
- [ ] Long plant names and long notes wrap and truncate gracefully.

## Accessibility

- [ ] All major buttons have accessible labels (verify with VoiceOver/TalkBack).
- [ ] Segmented choices announce selection state.
- [ ] Destructive actions (delete, replace) have a hint that warns the user.
- [ ] Text contrasts meet AA in light and dark modes.

## LeafCue Plus (billing)

See `revenuecat-testing.md` for the full matrix and offline steps.

- [ ] App boots with no RevenueCat key set; Settings → Plus shows a calm
      "billing unavailable / try again" state, never a crash.
- [ ] With the Test Store key set, the `current` offering loads and the paywall
      shows monthly + yearly cards with prices from RevenueCat (not hardcoded).
- [ ] Under 20 active plants, adding a plant never shows the paywall.
- [ ] At 20 active plants, creating plant #21 shows the paywall and does not
      create the plant until Plus is purchased.
- [ ] Purchasing the Test Store product activates `plus`, closes the paywall,
      and allows plant #21; Settings → Plus shows the active state.
- [ ] Restore purchases only runs on user tap and updates Plus state.
- [ ] Offline with no cached Plus at the limit shows the offline dialog, not a
      broken/empty paywall; no plant is created.
- [ ] Offline with cached Plus active still allows the gated action.
- [ ] With Plus inactive and 30 active plants, existing plants remain visible,
      editable, and exportable; only new active plants are blocked.
- [ ] Unarchiving over the limit without Plus shows the gate; archiving is never
      blocked.
- [ ] Paywall is polished and readable in both light and dark mode.

## Privacy verification

- [ ] `rg fetch apps/native` returns no plant-data network calls.
- [ ] `rg trpc apps/native` and `rg better-auth apps/native` return nothing.
- [ ] RevenueCat is only referenced under `lib/billing`, the billing
      bootstrapper/store, the paywall, and the plant-limit gate/hook.
- [ ] No plant names, photos, logs, notes, or care data are passed to
      RevenueCat (anonymous users only; no custom `appUserID`).
- [ ] `apps/native/package.json` does not depend on `@leafcue/server`.
