# LeafCue Context

LeafCue is a local-first, privacy-first, offline-first plant care tracker. The
native app uses Expo SQLite and Drizzle as its source of truth.

## Domain Language

- **Plant**: a user's tracked houseplant, including identity, care profile,
  location, photos, archive state, and favorites.
- **Room**: a named location that can contain plants and shelves.
- **Shelf**: a sub-location within a room.
- **Care Task Template**: a reusable care type, such as water or fertilize,
  that can supply a default interval and instructions.
- **Plant Task Schedule**: a per-plant care cue with interval, due date,
  snooze state, enabled state, and reminder preferences.
- **Care Log**: immutable history of a completed care action.
- **Plant Timeline**: the merged per-plant feed of care logs, journal entries,
  photos, growth measurements, and health observations.
- **Care Read Model**: a screen-ready local database projection for care
  workflows, such as due tasks, task counts, plant detail data, or calendar
  agenda data.
- **Task Lifecycle**: the set of state-changing care actions that mutate
  schedules and logs, then keep local reminders in sync.
- **Plant Intake**: the create/edit flow that maps form values, plant presets,
  and user-entered care profile fields into persisted plant data.
- **Backup Restore Graph**: the ordered import plan that restores tables,
  remaps IDs, restores bundled photos, and clears device-bound notification
  IDs.
