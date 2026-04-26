# Step 4 — Plant life features implementation notes

This step turns the per-plant view into a full life timeline: a dedicated
plant detail screen with hero, today tasks, and a unified timeline; sub
screens for Journal, Photos, Growth and Health; a soft Insights tab; and a
Today health banner. Everything stays local-first; no auth, tRPC,
network, or cloud sync was introduced.

## Feature summary

- **Plant detail screen** (`screens/plants/detail/`) replaces direct
  pushes to the edit modal. Hero with cover/nickname/species/room/status,
  quick actions (water, fertilize, more), Today tasks, unified timeline
  with filter chips, care profile with smart hint, mini photo strip,
  growth snippet, and notes preview. Long-press the hero to edit.
- **Plant journal** (`screens/plants/journal/`) full-screen list with
  filter pills, day-grouped headers, a TanStack Form sheet that supports
  title, body, mood, entry type, and an optional photo. Edit and delete
  preserve and clean up replaced photos.
- **Plant photos** (`screens/plants/photos/`) grid view, full detail sheet
  for editing caption / setting as cover / deleting, and a before/after
  compare card that picks the oldest and most recent photos.
- **Plant growth** (`screens/plants/growth/`) progress card, height
  sparkline (`react-native-svg`) of the last 8 readings, and a
  measurement sheet (height, leaves, blooms, notes, date).
- **Plant health** (`screens/plants/health/`) status-grouped sections
  (Active / Improving / Resolved), advisory hints per issue and severity,
  and quick "mark improving" / "mark resolved" actions on each card.
- **Today health banner** added to `screens/today/index.tsx` showing up
  to three plants with active observations, tapping into the per-plant
  health screen.
- **Insights tab** (`screens/insights/`) with composable cards driven by
  a single repository call: care streak, watering consistency, most
  cared-for, most overdue right now, recent growth milestones, active
  health issues, and recently neglected plants.

## Schema delta

Migration `apps/native/drizzle/0002_overconfident_mantis.sql` (bundled in
`apps/native/drizzle/migrations.js`) updates schema to support the new
flows:

- `journal_entries.photo_uri text` (nullable) — single optional photo per
  entry, persisted on the device under the existing photos directory.
- `journal_entries.entry_type` allowed values evolved: `note`,
  `milestone`, `issue`, `treatment`, `observation` (replaces
  `celebration`). The migration `UPDATE`s legacy `celebration` rows to
  `milestone`.
- `health_observations.status` allowed values evolved: `active`,
  `improving`, `resolved` (replaces `open` and `monitoring`). The default
  is now `active`. Legacy rows are mapped (`open`→`active`,
  `monitoring`→`improving`).
- New `health_issue_type` enum (`yellow_leaves`, `brown_tips`, `pests`,
  `root_rot`, `wilting`, `leaf_drop`, `mold`, `other`) lives in
  `lib/db/schema.ts`; `health_observations.issue_type` stays a free text
  column for forward compatibility but is validated against the enum on
  write.

`apps/native/lib/db/zod.ts` was extended with `healthIssueTypeSchema` and
the new `photoUri` field on `journalEntryInsertSchema`. Repositories
were updated together with these changes.

## Repositories and libs

- `lib/db/repositories/journal.ts` rewritten to use Drizzle transactions
  on create/update/delete so a replaced or deleted photo is cleaned up
  with `removePersistedPhoto` only after the row write succeeds.
- `lib/db/repositories/health.ts` adds `onlyActive` filter,
  `updateHealthObservation`, `updateHealthObservationStatus`, and
  `getActiveHealthObservationsAcrossPlants` (used by the Today banner
  and the insights summary).
- `lib/db/repositories/photos.ts` adds `updatePlantPhotoCaption` and a
  transactional `setPlantPhotoAsCover` that mirrors the chosen photo
  uri onto `plants.photo_uri`.
- `lib/db/repositories/insights.ts` (new) exposes a single
  `getInsightsSummary(db)` that returns a typed `InsightsSummary` with
  care-streak (consecutive days of any care log), watering consistency
  (per-plant std-dev of inter-water gaps), most cared-for, most overdue
  right now, recent growth milestones, active health issues, and
  recently neglected plants.
- `lib/care/health-hints.ts` (new) is a pure mapping from
  `HealthIssueType` + `HealthSeverity` to a short list of advisory
  strings. Used on the health screen and the form sheet.
- `lib/dates.ts` adds `formatDayHeader` for the timeline section
  headers.

## Routing

`apps/native/app/_layout.tsx` registers four new push routes:

- `/plants/[plantId]` — plant detail (push, with header hidden).
- `/plants/[plantId]/journal`
- `/plants/[plantId]/photos`
- `/plants/[plantId]/growth`
- `/plants/[plantId]/health`

`apps/native/app/(tabs)/_layout.tsx` adds an Insights tab between Plants
and Rooms. All existing places that pushed to `/plants/[plantId]/edit`
now push to `/plants/[plantId]` instead — Today, Plants library, Tasks
queue, and Calendar agenda. The edit screen is still reachable via the
hero long-press on the new detail screen.

## Forms and UI conventions

- All forms use TanStack Form with HeroUI Native primitives
  (`TextField`, `Label`, `Input`, `TextArea`, `Button`, `Spinner`,
  `BottomSheet`).
- Photo capture/picker reuses `components/photo-picker-field`; persisted
  photos go through `lib/photos.ts` so files live alongside other
  per-plant photos.
- Smart hints (care profile, health) are rendered as advisory chips with
  light copy. They are heuristics, not diagnoses, and they never block
  saves.
- The plant detail screen uses `KeyboardAwareScreen` to keep input-heavy
  surfaces predictable under the existing `KeyboardProvider`.

## Insights aggregation

`getInsightsSummary` queries Drizzle directly (no view caching). It is
cheap because the data shape is small per device. Highlights:

- **Care streak**: walks back from today through `careLogs.completedAt`
  day buckets until a gap is found.
- **Watering consistency**: average of per-plant standard deviation of
  water-log gaps over 120 days. Buckets into `steady`, `mostly_steady`,
  or `catching_up`.
- **Most cared-for / overdue / neglected** all join through
  `plants.archivedAt IS NULL` so archived plants never surface here.

## Files changed (high level)

- Schema: `lib/db/schema.ts`, `lib/db/zod.ts`,
  `drizzle/0002_overconfident_mantis.sql`,
  `drizzle/migrations.js`, `drizzle/meta/_journal.json`,
  `drizzle/meta/0002_snapshot.json`.
- Repositories and libs: `lib/db/repositories/{journal,health,photos,insights}.ts`,
  `lib/db/repositories/index.ts`, `lib/care/health-hints.ts`,
  `lib/dates.ts`.
- Navigation: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, new route
  stubs under `app/(tabs)/insights.tsx` and `app/plants/[plantId]/*.tsx`.
- Today rerouting + health banner: `screens/today/index.tsx`.
- Reroutes to detail push: `screens/plants/library/index.tsx`,
  `screens/tasks/index.tsx`, `screens/calendar/index.tsx`.
- New screens:
  - `screens/plants/detail/` (index + 11 components).
  - `screens/plants/journal/` (index + form sheet + entry card).
  - `screens/plants/photos/` (index + detail sheet + before/after).
  - `screens/plants/growth/` (index + progress card + sparkline + form).
  - `screens/plants/health/` (index + observation card + form sheet).
  - `screens/insights/` (index + 4 composable cards).

## Quality checks

- `pnpm check-types` (Turborepo) — passes for all packages.
- `pnpm check` — only pre-existing diagnostics remain in
  `packages/ui` (shadcn template). No new errors were introduced by
  the step-4 work.
