# Step 2 — Core UX implementation notes

This step delivered LeafCue's first-run onboarding, Today dashboard, Plant
Library, Add/Edit Plant flow, and Rooms management. Everything ships behind
Expo SQLite + Drizzle and stays 100% offline; no auth, tRPC, network, or
analytics were introduced.

## Summary

- Replaced the drawer/tabs template scaffold with a clean three-tab shell
  (Today, Plants, Rooms) and modal plant new/edit routes.
- Added a Zustand-backed onboarding gate that hydrates from
  `onboarding_state` and routes first-run users into a 5-screen tour.
- Built a `screens/today` dashboard with quick stats, overdue/today/upcoming
  task lists, favorite plants, and a floating "+" action.
- Built `screens/plants/library` with search, filter chips
  (All/Favorites/Due today/Overdue/By room), grid/list toggle, archived
  toggle, and a polished empty state.
- Built `screens/plants/edit` (used for both `plants/new` and
  `plants/[plantId]/edit`) with TanStack Form, Zod validation,
  `react-native-keyboard-controller`, photo picker, preset prefill (never
  overrides user input), and `createPlantWithDefaults` transactional create.
- Built `screens/rooms` with CRUD for rooms and shelves, plant counts,
  default-room seed action, and inline rename/delete confirmation.
- Added local photo storage via `expo-image-picker` + `expo-file-system` to
  `documentDirectory + plant-photos/` so URIs survive app launches.

## New dependencies

Added to `apps/native/package.json`:

- `expo-image-picker` — registered in `apps/native/app.json` plugin block
  with explicit photo and camera permission strings.
- `expo-file-system` — used to copy picked images into a stable directory.
- `expo-linear-gradient` — gradient surface for `HeroScreen`.
- `date-fns` — relative date strings, parsing, and formatting helpers.

A development build rebuild (or fresh EAS build) is required to pick up the
new picker plugin.

## File map

### Routing

- `app/_layout.tsx` — root Stack, hosts `(tabs)`, onboarding stack, and
  modal plant routes; wraps in `OnboardingGate`.
- `app/(tabs)/_layout.tsx` — bottom tabs (Today, Plants, Rooms) with
  theme-aware tint and icons.
- `app/(tabs)/index.tsx` → `screens/today`.
- `app/(tabs)/plants.tsx` → `screens/plants/library`.
- `app/(tabs)/rooms.tsx` → `screens/rooms`.
- `app/onboarding/_layout.tsx` + `index.tsx`/`privacy.tsx`/`track.tsx`/
  `room.tsx`/`finish.tsx` → onboarding stack.
- `app/plants/new.tsx` → `EditPlantScreen` (mode="create").
- `app/plants/[plantId]/edit.tsx` → `EditPlantScreen` (mode="edit").

### Stores

- `stores/use-onboarding-store.ts` — Zustand store with
  `loading`/`needs_onboarding`/`done` status and `hydrate`/`complete`/
  `reset` actions. Reads/writes through `getOnboardingState`/
  `setOnboardingState`.

### Reusable components

- `components/hero-screen.tsx` — gradient hero wrapper.
- `components/keyboard-aware-screen.tsx` — wrapper around
  `KeyboardAwareScrollView` from `react-native-keyboard-controller`.
- `components/plant-card.tsx` — grid + list variants (uses `expo-image`).
- `components/care-task-card.tsx` — due-task row with Done/Snooze actions.
- `components/empty-state.tsx` — themed empty state with optional CTAs.
- `components/section-header.tsx` — uppercase label + count + action.
- `components/stat-pill.tsx` — quick-stats chip.
- `components/room-chip.tsx` — room/shelf pill.
- `components/photo-picker-field.tsx` — circular preview + library/camera
  picker; persists picks via `lib/photos.ts`.
- `components/onboarding-gate.tsx` — imperative router gate.
- `components/tanstack-form-fields.tsx` — `FormTextField`, `FormTextArea`,
  `FormSwitchField`, `FormChipGroupField`, `FormSelectField`, `FormSection`
  wrappers around HeroUI Native primitives.

### Screens

- `screens/today/index.tsx` — quick stats, overdue/today/upcoming sections,
  favorites carousel, empty state, FAB.
- `screens/plants/library/index.tsx` — search, filter chips, grid/list
  toggle, archived toggle, FAB, empty state.
- `screens/plants/edit/index.tsx` — TanStack Form-backed create/edit flow.
- `screens/rooms/index.tsx` — rooms list, expand for shelves, add forms,
  rename, delete, suggested-rooms helper.
- `screens/onboarding/_components/onboarding-shell.tsx` — shared shell
  with progress dots, skip, footer actions.
- `screens/onboarding/welcome.tsx`, `privacy.tsx`, `track.tsx`, `room.tsx`,
  `finish.tsx` — five onboarding steps.

### Data layer

- `lib/db/zod.ts` — added `plantRouteParamsSchema`,
  `onboardingValueSchema`, and `onboardingKeys`.
- `lib/db/repositories/plants.ts` — added
  `createPlantWithDefaults(db, input, options?)` that runs the plant insert
  and default `water` + `fertilize` schedules in a single
  `db.transaction(...)`. Falls back to template defaults; no schema change.
- `lib/db/repositories/tasks.ts` — added `getUpcomingTasks(db, days, now?)`
  helper used by the Today dashboard.
- `lib/db/seeds/default-rooms.ts` — Living Room, Bedroom, Kitchen, Balcony,
  Office, with stable `sortOrder` and Ionicon names.
- `lib/db/seed.ts` — `seedDefaultRoomsIfEmpty` is invoked inside the
  existing `runSeeds(...)` transaction (idempotent).
- `lib/photos.ts` — `pickPlantPhoto`, `persistPickedPhoto`,
  `deletePersistedPhoto` using the new `expo-file-system` API.
- `lib/dates.ts` — `startOfToday`, `isOverdue`, `isDueToday`,
  `relativeDueLabel`, `formatLongDate`, `formatIsoDate`, `parseIsoDate`,
  `timeOfDayGreeting`, `relativeFromNow`.

## Behavior notes

- Onboarding is gated only on first launch. Skip, "Add later", and the
  finish screen all call `useOnboardingStore.complete(db)` and route to
  `/(tabs)`.
- The library archive toggle is local to the screen and starts hidden.
  Filters compose with archive state.
- The edit screen uses preset hints to fill empty fields only; once a user
  types into a field, presets never overwrite the value.
- Photos are copied with `expo-file-system`'s `Directory`/`File` API into
  `Paths.document/plant-photos/`. Replacing or removing a photo deletes the
  previous file when it lives inside that directory.
- Today's "Snooze" action pushes the schedule out by 4 hours. "Done" calls
  the existing `completeTask` repository helper, which also rolls
  `nextDueAt` forward.

## Quality gates

- `pnpm --filter @leafcue/native check-types` — clean.
- `pnpm check-types` — clean across the monorepo.
- `pnpm check` — `apps/native` and the new code is clean. Pre-existing
  template errors remain in `packages/ui` (web shadcn primitives that this
  step does not touch); they were present before this work and are out of
  scope.

## Follow-up tasks for the next agent

- Plant detail timeline screen (care logs, journal, photos, growth, health)
  — the data layer already exposes `getPlantTimeline`.
- Photo capture entry points beyond the cover photo (gallery view, journal
  attachments).
- Local notifications for due tasks and snooze handling on background.
- Journal and health workspaces (`screens/journal`, `screens/health`).
- Growth measurement charting and history.
- Optional: archive list view and unarchive action in the library.
- Optional: room reordering and shelf icons.
