# LeafCue UX Upgrade — Codex Agent Prompt

Use this prompt in Codex while working on the **local LeafCue repo**. Do not assume the remote GitHub repo is identical to the local checkout. Inspect the local files first, then make the smallest production-quality changes needed.

---

## Research summary

### Product goal

Make LeafCue the easiest, calmest, most useful plant care app for everyday users. The product should win by being **task-first, private, offline-first, and low-friction**, not by copying every AI/cloud/paywalled feature from competitors.

### Current LeafCue direction to preserve

- LeafCue is a local-first, privacy-first, offline-first plant care tracker.
- `apps/native` is the main product app.
- Native local data is the source of truth: Expo SQLite + Drizzle.
- Do not introduce backend, accounts, sync, analytics, cloud AI, subscriptions, or tracking.
- Core care flows must work offline.
- Ask notification permission only when the user enables reminders.
- Use HeroUI Native, Expo Router, Zustand, TanStack Form + Zod, `expo-image`, and `react-native-keyboard-controller` patterns already in the repo.

### Competitor and inspiration findings

#### Planta

Strengths to learn from:

- Strong “keep your plants alive” promise.
- Individual care schedules and reminders.
- Smart watering reminders, fertilizing/misting/repot/cleaning reminders.
- Plant organization, journal, identification, light meter, community, care sharing.

LeafCue opportunity:

- Planta is powerful but can feel heavy and premium-feature driven. LeafCue should feel simpler, calmer, faster, private, and offline.

#### PictureThis

Strengths to learn from:

- Fast plant identification.
- Very deep care information.
- Toxicity warnings and plant care guidance.

Weakness/opportunity:

- Some reviewers find it subscription-heavy and overwhelming. LeafCue should avoid overwhelming users with too much info at once.

#### Plant Parent

Strengths to learn from:

- Smart reminders and plant calendar.
- Care questions, placement/sunlight guidance, illness/treatment flow, expert/chat-style help.

LeafCue opportunity:

- Keep smart hints deterministic and local. Do not make medical/diagnostic claims about plants. Use advisory language like “Could be,” “Check for,” and “Try next.”

#### Happy Plant

Strengths to learn from:

- Simple watering reminders.
- Friendly naming, plant photos/selfies, time-lapse/progress motivation.
- Makes a routine task feel rewarding.

LeafCue opportunity:

- Add gentle joy and progress without making the app childish or distracting.

#### Mobbin research: Greg plant care flows

Mobbin was available and reviewed. Relevant patterns:

- **Schedule flow:** Schedule-centered home screen with Today/Upcoming tabs, plant rows, task amounts, overdue age, and simple bottom navigation.
- **Adding a plant flow:** Starts with a very clear “Let’s start by adding your plants” screen, photo/upload actions, crop/select, then lands on a care schedule with a “Finish Personalizing Care” progress card.
- **Plant information flow:** Plant detail uses a visual water-level section, clear “I’m hydrated” CTA, sunlight section, care category tabs, and FAQ-style explanations.
- **Managing care reminders flow:** Uses “Seasonal Updates,” location/context, and “Goal Type” choices such as Ease/Balanced/Growth to adjust schedule behavior.
- **Identify/Add flow:** Camera UI has very direct helper text like “Try turning on some lights.”

#### Mobbin research: Forest reminder flow

Forest is not a plant-care app, but the reminder flow is useful:

- Simple settings grouping.
- Clear time picker modal.
- Repeat toggle.
- A plain list of reminders with on/off switches.

---

## Strategy

Do **not** build a huge competitor clone. LeafCue should become users’ favorite because it is easier to understand and faster to use.

The highest-impact upgrade is a cohesive UX pass around three moments:

1. **Daily care:** “What do I need to do now?” must be obvious in 3 seconds.
2. **Adding a plant:** A new user should add their first plant and care schedule in under 60 seconds.
3. **Plant detail:** A user should quickly understand “how is this plant doing, what is next, and why?”

---

# Codex implementation prompt

You are working in the LeafCue monorepo locally.

## Hard constraints

- Preserve local-first, offline-first behavior.
- Do not connect `apps/native` or `apps/web` to `apps/server`.
- Do not add auth, cloud sync, tRPC clients, analytics, tracking, subscriptions, server calls, remote plant identification, remote AI diagnosis, or internet requirements.
- Keep `apps/server` parked unless explicitly required by an inspected existing build issue.
- Use existing dependencies and patterns before adding new libraries.
- Do not use `packages/ui` in native. It is web-only.
- Native UI must use HeroUI Native and existing app tokens/themes.
- Use `expo-image`, not `Image` from `react-native`.
- Use `react-native-keyboard-controller` for input-heavy native screens; do not add `KeyboardAvoidingView`.
- Native forms must use TanStack Form + Zod + HeroUI Native controls.
- Use Zod for user input, route params, persisted data, imports, and any derived payloads.
- Use Zustand stores in `apps/native/stores/use-*.ts` for app-owned shared state. Do not create React Context for app state unless there is a provider/framework reason.
- Use Drizzle transactions for multi-step writes.
- Reminder permission must only be requested when the user explicitly enables reminders.
- Smart hints must remain deterministic local heuristics and advisory only. No plant disease diagnosis claims.

## Files and folders to inspect first

Inspect these before making changes:

```txt
README.md
AGENTS.md
apps/native/package.json
apps/native/app
apps/native/screens/today
apps/native/screens/onboarding
apps/native/screens/plants
apps/native/screens/plants/add
apps/native/screens/plants/detail
apps/native/screens/plants/edit
apps/native/screens/plants/schedules
apps/native/screens/calendar
apps/native/screens/tasks
apps/native/screens/settings
apps/native/components
apps/native/hooks
apps/native/stores
apps/native/lib/db/schema.ts
apps/native/lib/db/repositories
apps/native/lib/db/helpers
apps/native/lib/db/zod.ts
apps/native/lib/notifications
apps/native/lib/backup
apps/native/drizzle
```

Also search for these terms and inspect the matching files:

```txt
useTodayReadModel
CareTaskCard
TaskActionSheets
plantTaskSchedules
careLogs
healthObservations
plantPhotos
growthMeasurements
reminder
notificationId
onboarding
backup
archive
favorite
```

## Phase 0 — Baseline audit before editing

Before changing code:

1. Run or inspect the app enough to understand the current Today dashboard, Plants library, Add/Edit Plant flow, Plant Detail, Schedule Editor, Rooms/Shelves, Settings, local reminders, and backup/export behavior.
2. Write a short local note in your working summary, not necessarily committed, listing:
   - What already exists and should be preserved.
   - Which screen owns each part of the care flow.
   - Whether backup/export already exists and where.
   - Whether current add-plant flow already uses TanStack Form + Zod.
   - Whether any persisted schema changes are actually necessary.
3. Prefer derived UI over schema changes unless persistence is clearly needed.

## Phase 1 — Today screen: make daily care obvious

Goal: In 3 seconds, the user should know whether they are done for today, what is overdue, what is due now, and what is coming next.

### Implement/refactor

Create or refine a Today “care queue” experience:

- A calm top summary card:
  - “All caught up” when there are no overdue/today tasks.
  - Otherwise show counts for overdue, due today, and upcoming.
  - Include a small privacy/offline reassurance line, for example: “Works offline. Your plant data stays on this device.”
- Task groups in this order:
  1. Overdue
  2. Due today
  3. Upcoming
  4. Recently cared for / recent activity, if data already supports it
- Each task row/card should clearly show:
  - Plant photo or fallback icon.
  - Plant nickname.
  - Task type.
  - Due status: overdue by X, today, tomorrow, in N days.
  - Amount/instructions when available.
  - Primary action: complete.
  - Secondary actions: snooze, skip once, reschedule/edit where already supported.
- Keep one-handed use in mind. Avoid burying complete/snooze/skip behind too many taps.
- Use empty states that help the user move forward:
  - No plants: “Add your first plant.”
  - Plants but no schedules: “Add a care schedule.”
  - All caught up: “Nice, your plants are cared for today.”

### Components/hooks to consider

Prefer extracting route-owned UI into reusable pieces if current files are large:

```txt
apps/native/screens/today/components/care-summary-card.tsx
apps/native/screens/today/components/care-queue-section.tsx
apps/native/screens/today/components/care-task-row.tsx
apps/native/screens/today/components/today-empty-state.tsx
apps/native/screens/today/hooks/use-today-care-queue.ts
```

Use existing naming and folder patterns if they differ.

### Acceptance criteria

- Today is usable with zero plants, one plant, many plants, overdue tasks, and all-caught-up state.
- Existing complete/undo/snooze/reschedule/skip/edit/disable behavior still works.
- No internet/backend required.
- No notification permission request happens on app launch.

## Phase 2 — Add Plant: under-60-second first success

Goal: A new user should add their first plant and get useful care cues quickly, without feeling forced into photo scanning, accounts, or complex setup.

### UX shape

Refactor the add plant flow into a simple wizard or staged form, depending on existing architecture:

1. **Start**
   - Title: “Add your plant”
   - Options:
     - Search common plant presets
     - Add manually
     - Add photo later / choose photo if already supported locally
   - Avoid remote plant identification unless the repo already has a local-only feature. Do not add cloud identification.
2. **Plant basics**
   - Nickname required.
   - Species/common name optional but encouraged.
   - Photo optional.
3. **Where it lives**
   - Room/shelf optional.
   - Light condition / distance from window / drainage / pot size if the current schema/UI already supports these fields.
   - Keep this short. Advanced details can be completed later.
4. **Care style**
   - Segmented choice: `Ease`, `Balanced`, `Growth`.
   - Explain simply:
     - Ease: fewer reminders.
     - Balanced: recommended default.
     - Growth: more attentive care.
   - Use this to preview generated schedule intervals, not to make hard scientific claims.
5. **Schedule preview**
   - Show proposed watering/fertilizing/misting/etc. schedules based on preset + current local heuristics.
   - Let the user edit intervals before saving.
6. **Reminders**
   - Keep reminders off unless user turns them on.
   - Ask notification permission only at that moment.
7. **Finish**
   - Save plant + schedules in a Drizzle transaction.
   - Navigate to Today or Plant Detail with a “Finish personalizing care” card if important details are missing.

### Data guidance

First try to derive “setup completeness” from existing fields:

- nickname
- common/scientific name or preset
- photo
- room/shelf
- light preference
- watering preference
- pot/drainage fields
- at least one enabled care schedule

Only add persisted fields if truly useful. If adding fields, prefer minimal nullable/default-safe columns, for example:

```ts
careStyle: text("care_style").$type<"ease" | "balanced" | "growth">().notNull().default("balanced")
setupCompletedAt: integer("setup_completed_at", { mode: "timestamp_ms" })
```

Do not add these if the existing schema already has equivalent fields.

### Required implementation details

- Use TanStack Form + Zod.
- Validate route params and form input with Zod.
- Use `react-native-keyboard-controller` for keyboard-heavy steps.
- Use `expo-image` for plant photos.
- Use Drizzle transactions for create plant + schedules + first photo/log writes.
- Keep image/photo handling local.

### Components/hooks to consider

```txt
apps/native/screens/plants/add/components/add-plant-step-shell.tsx
apps/native/screens/plants/add/components/plant-basics-step.tsx
apps/native/screens/plants/add/components/plant-location-step.tsx
apps/native/screens/plants/add/components/care-style-step.tsx
apps/native/screens/plants/add/components/schedule-preview-step.tsx
apps/native/screens/plants/add/hooks/use-add-plant-form.ts
apps/native/screens/plants/add/lib/setup-completeness.ts
apps/native/screens/plants/add/lib/care-style.ts
```

Adapt paths to the current local structure.

### Acceptance criteria

- User can add a plant without a photo.
- User can add a plant without internet.
- User can skip advanced details and finish setup later.
- Generated schedules are visible before saving.
- Saving is atomic: no half-created plant without schedules unless the user explicitly chooses no schedules.
- Reminder permission is requested only after enabling reminders.

## Phase 3 — “Finish personalizing care” progress card

Goal: Borrow the useful part of Greg’s Mobbin flow without making setup feel like homework.

### Implement

Add a derived setup progress card shown on Today and/or Plant Detail when a plant is missing useful care details.

Examples of checklist items:

- Add photo
- Add room or shelf
- Add light preference
- Add watering preference
- Confirm pot/drainage
- Enable at least one care schedule
- Add first care note/photo

UX rules:

- Keep it dismissible or non-annoying if possible.
- Show progress as friendly text: “3 of 6 care details added.”
- Use direct actions that deep-link to edit the missing detail.
- Do not block normal app use.

### Prefer derived state

Implement this as a pure utility if possible:

```txt
getPlantSetupProgress(plant, schedules, photos, logs): {
  completed: number;
  total: number;
  percent: number;
  missingItems: Array<{ key; label; action }>;
}
```

Add unit tests for this utility if the repo has a test pattern.

## Phase 4 — Plant Detail: make each plant feel alive and understandable

Goal: A user opening a plant should immediately understand “what is next, what happened recently, and what should I do?”

### Refactor layout

Top section:

- Plant photo, nickname, common/scientific name.
- Room/shelf.
- Next due cue.
- Care status: overdue / due today / all good / schedule missing.
- Quick actions:
  - Water / complete next task
  - Snooze
  - Add note
  - Add photo
  - Edit schedule

Main sections in this order:

1. **Now & Next**
   - Next task and upcoming tasks.
   - Clear reason text: “Based on last watered 6 days ago and your 7-day interval.”
2. **Care Plan**
   - Active schedules with intervals, preferred time, reminder status.
   - Edit entry points.
3. **Plant Profile**
   - Light, water, soil, pot, drainage, toxicity, difficulty.
   - Keep collapsed/compact if long.
4. **Journal & Photos**
   - Recent care logs and photos.
   - CTA after completing care: “Add a quick progress photo?”
5. **Growth**
   - Use existing growth measurements if present.
6. **Health Notes**
   - Existing health observations.
   - Advisory language only.

### Add a local “Why this cue?” explanation

For each due task, create a small explanation sheet/card:

- Last completed date.
- Interval.
- Snooze/reschedule state if any.
- Reminder time if enabled.
- Any local hint such as light/pot/drainage, only if deterministic and already in data.

Do not claim weather-aware intelligence unless that is fully local and already implemented.

### Components/hooks to consider

```txt
apps/native/screens/plants/detail/components/plant-hero-card.tsx
apps/native/screens/plants/detail/components/plant-next-care-card.tsx
apps/native/screens/plants/detail/components/care-plan-card.tsx
apps/native/screens/plants/detail/components/plant-profile-card.tsx
apps/native/screens/plants/detail/components/plant-timeline-card.tsx
apps/native/screens/plants/detail/components/why-this-cue-sheet.tsx
apps/native/screens/plants/detail/hooks/use-plant-detail-read-model.ts
```

## Phase 5 — Schedule editor: simple smart controls

Goal: Make reminders easier to understand and adjust than competitors.

### Implement/refine

- Keep existing schedule editor behavior, but make it clearer.
- Add a schedule preview before save if not already present.
- Add or refine segmented “care style” controls if useful:
  - Ease: reduce frequency slightly.
  - Balanced: default.
  - Growth: increase attention slightly.
- Apply care style as deterministic interval multipliers with guardrails:
  - Never create impossible intervals.
  - Never schedule multiple reminders at annoying times by default.
  - Keep user edits final.
- Show plain-language explanations:
  - “Water every 7 days.”
  - “Next due Friday at 9:00 AM.”
  - “Reminders are off.”

### Reminder handling

- If changing preferred time or enabling/disabling reminders, update local notification schedule consistently.
- If a notification ID is replaced, clean up the old one if existing helper supports it.
- Do not request permission unless enabling reminders.

## Phase 6 — Plants Library: faster finding and filtering

Goal: Users with many plants should still feel organized.

### Implement/refine

Add or improve:

- Search by nickname/common/scientific name.
- Filters:
  - Favorites
  - Needs attention / overdue
  - Due soon
  - Room/shelf
  - Archived hidden by default
- Sorts:
  - Next due
  - Name
  - Recently added
  - Room
- Empty states:
  - No search results: “No plants match this search.”
  - No plants yet: “Add your first plant.”
- Make Add Plant action easy to reach.

Use derived read models and avoid expensive per-render DB work.

## Phase 7 — Gentle progress and motivation

Goal: Make LeafCue pleasant enough that users want to come back, without gamification clutter.

### Implement/refine

- After completing a task, optionally show a small success state:
  - “Nice, Monstera is cared for.”
  - “Add a quick photo to track progress?”
- Surface recent care in Plant Detail and Today.
- If existing logs/photos/growth data support it, show a lightweight timeline.
- Avoid streak pressure that makes users feel guilty. If using streak-like language, keep it gentle.

## Phase 8 — Settings and privacy confidence

Goal: Make local-first privacy visible.

### Implement/refine

In Settings and onboarding/empty states, include clear copy:

- “Works offline.”
- “Your plant data stays on this device.”
- “Back up your data before changing phones.”

If backup/export already exists:

- Make the entry easy to find.
- Improve copy and error states.
- Add a gentle backup reminder in Settings or Today when the user has several plants and no recent backup, only if backup timestamp exists locally.

If backup/export does not exist:

- Do not build a large backup system unless small and already aligned with repo patterns.
- At minimum, avoid claiming backup exists.

## Phase 9 — Accessibility and polish pass

Apply across touched screens:

- Minimum 44px touch targets where practical.
- Accessibility labels for icon-only buttons.
- Clear screen titles and section labels.
- Good empty/loading/error states.
- Respect light/dark themes.
- Avoid tiny low-contrast text.
- Keep copy calm and concise.
- Avoid unnecessary animation.

## Data and migration rules

If persisted data changes are needed:

1. Update `apps/native/lib/db/schema.ts`.
2. Update related Zod schemas in `apps/native/lib/db/zod.ts` or local validation files.
3. Update repositories/helpers/read models.
4. Generate migrations:

```bash
pnpm --filter @leafcue/native db:generate
```

5. Review generated files in `apps/native/drizzle`.
6. Ensure existing users’ data survives:
   - Add nullable columns or safe defaults.
   - Never drop/rename columns without a migration strategy.
   - Do not break existing notification IDs or task schedules.
7. Update seed data if relevant.
8. Update UI and tests together.

Prefer no schema change for:

- Setup progress if it can be derived.
- Care status if it can be derived.
- “Why this cue?” explanation if it can be derived.
- Library filters/sorts if they can be derived from existing data.

## Testing expectations

Add or update tests where the repo has a pattern. Prioritize pure utilities:

- Due grouping: overdue/today/upcoming.
- Setup progress calculation.
- Care style interval adjustment.
- “Why this cue?” explanation builder.
- Add plant validation schema.

If no test framework is configured for native, keep utilities small and typed, and mention this in the final summary.

## Verification commands

Run from repo root:

```bash
pnpm check
pnpm check-types
pnpm --filter @leafcue/native check-types
```

If schema changed, also run:

```bash
pnpm --filter @leafcue/native db:generate
```

Then re-run:

```bash
pnpm check
pnpm check-types
```

Manual QA checklist:

- Fresh install with no plants.
- Add first plant without photo.
- Add first plant with photo if supported.
- Add plant from preset if supported.
- Add manual plant with no species.
- Enable reminders and confirm permission is requested only then.
- Decline notification permission and confirm app still works.
- Complete task.
- Undo task.
- Snooze task.
- Skip once.
- Reschedule task.
- Disable schedule.
- Edit plant details.
- Archive/unarchive if supported.
- Dark mode.
- Offline mode / airplane mode.
- Existing seeded data still loads.
- Existing user data/migrations still work.

## Do not implement in this pass

Unless explicitly requested later, do not add:

- Backend sync.
- Auth/accounts.
- Cloud plant identification.
- Remote AI plant diagnosis.
- Social/community features.
- Analytics/tracking.
- Ads.
- Subscriptions/paywalls.
- Server imports in native/web.
- A complicated onboarding survey that blocks adding a plant.

## Final output expected from Codex

When finished, summarize:

1. What changed by screen/flow.
2. Any schema/migration changes.
3. Any reminder/notification behavior changes.
4. Any tests added or not added.
5. Commands run and results.
6. Manual QA still recommended.
7. Any follow-up work that should be a separate PR.

---

# Recommended implementation order

To keep this safe and reviewable, implement in small commits or PR-sized chunks:

1. Today care queue polish + empty states.
2. Add Plant wizard/flow simplification.
3. Setup progress card.
4. Plant Detail “Now & Next” refactor.
5. Schedule editor clarity.
6. Library search/filter polish.
7. Settings/privacy copy and backup discoverability.
8. Accessibility/copy polish.

The first two chunks are the most important. If time is limited, prioritize **Today** and **Add Plant** over deeper features.

---

# Product acceptance bar

LeafCue should feel better than competitors because:

- A new user can add a useful plant record quickly.
- Daily care actions are obvious.
- The app explains why a task is due.
- The app never requires an account, internet, or backend for core care.
- The app feels calm, not overwhelming.
- The app makes progress visible through logs/photos without pressure.
- The app is honest about local data and backup responsibility.
