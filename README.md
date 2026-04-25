# LeafCue

LeafCue is a local-first, privacy-first, offline-first plant care tracker.

The mobile app in `apps/native` is the product app. It stores plant care data locally with WatermelonDB and does not require auth or an external backend. The web app in `apps/web` is the public marketing site. The Worker in `apps/server` is kept for possible future backend, sync, or auth work.

## Stack

- `pnpm` + Turborepo monorepo
- Expo Router + React Native in `apps/native`
- WatermelonDB for local native persistence
- HeroUI Native + Uniwind for native UI
- TanStack Router/Start in `apps/web`
- shadcn UI primitives in `packages/ui`
- Hono, Better Auth, tRPC, Drizzle, and libsql/Turso in the parked server

## Getting Started

```bash
pnpm install
pnpm dev:native
pnpm dev:web
```

Native WatermelonDB requires an Expo prebuild/custom development build or EAS build. Expo Go will not include the WatermelonDB native module.

## Project Structure

```text
leafcue/
├── apps/
│   ├── native/      # LeafCue mobile app
│   ├── web/         # LeafCue marketing site
│   └── server/      # Parked future backend
├── packages/
│   ├── ui/          # Web-only shadcn components and styles
│   └── config/      # Shared TypeScript config
```

## Scripts

- `pnpm dev`: run the full Turbo dev graph
- `pnpm dev:native`: start the Expo app
- `pnpm dev:web`: start the marketing site
- `pnpm dev:server`: start the parked Worker
- `pnpm check-types`: run TypeScript checks across the monorepo
- `pnpm build`: build all packages
- `pnpm deploy:web`: deploy the web Worker
- `pnpm deploy:server`: deploy the parked server Worker

Server database scripts are still available for future backend work: `pnpm db:push`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`, and `pnpm db:local`.

## UI Notes

- Native UI uses HeroUI Native components and default light/dark themes.
- Native images should use `Image` from `expo-image`.
- Native input screens should use `react-native-keyboard-controller`.
- Web UI uses shadcn components from `@leafcue/ui`.
- All forms use TanStack Form + Zod with platform UI primitives.
- All validation should use Zod.
