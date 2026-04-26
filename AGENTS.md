# LeafCue Agent Guide

## Product Direction

- LeafCue is a local-first, privacy-first, offline-first plant care tracker.
- `apps/native` is the product app. It must work without auth, tRPC, cookies, or an external backend.
- `apps/web` is the public marketing site for LeafCue.
- `apps/server` is parked for possible future use. Keep it healthy, but do not wire clients to it unless the task explicitly asks for backend, sync, or auth work.
- Workspace packages use the `@leafcue/*` scope.

## Monorepo Map

- Root: `pnpm` + Turborepo.
- `apps/native`: Expo Router React Native app, Expo SQLite + Drizzle local data, HeroUI Native UI.
- `apps/web`: TanStack Router/Start marketing site, shadcn UI from `packages/ui`.
- `apps/server`: Cloudflare Worker with Hono, Better Auth, tRPC, Drizzle, and libsql/Turso for future server-backed features.
- `packages/ui`: shared web-only shadcn components and CSS.
- `packages/config`: shared TypeScript config.

## Native Rules

- Treat Expo SQLite + Drizzle as the native source of truth. Change `apps/native/lib/db/schema.ts`, generated migrations in `apps/native/drizzle`, and database helpers together.
- Generate native migrations with `pnpm --filter @leafcue/native db:generate` after changing Drizzle table definitions, and keep migrations bundled in the app.
- Use Drizzle transactions for multi-step native database writes.
- Do not add native auth, Better Auth, tRPC, cookie forwarding, `@leafcue/server` imports, or server URL requirements unless explicitly requested.
- Use HeroUI Native components and the default HeroUI Native light/dark themes. Native UI must not use `packages/ui`.
- Use `expo-image` for images. Do not import `Image` from `react-native`.
- Wrap input-heavy screens with `react-native-keyboard-controller` primitives under the existing `KeyboardProvider`; do not rely on React Native `KeyboardAvoidingView`.
- Native forms must use TanStack Form + Zod + HeroUI Native form controls such as `TextField`, `Label`, `Input`, `FieldError`, `Button`, and `Spinner`.
- Use Zod for any validation of user input, persisted data, route params, imports, or sync payloads.
- Use Zustand for app-owned shared state in `apps/native/stores/use-*.ts`. Do not create React Context for app state.
- Native dependencies with native code must be listed in `apps/native/package.json` for Expo autolinking.
- `expo-sqlite` is the native persistence layer; after native module or config plugin changes, rebuild the development build or EAS build.

## Web Rules

- `apps/web` is a marketing site by default, not a server-backed dashboard.
- Use shadcn components and theme tokens from `packages/ui`; app-specific composition belongs in `apps/web/src/components`.
- Web forms must use TanStack Form + Zod + shadcn form primitives from `packages/ui`.
- Follow shadcn form conventions: `FieldGroup`/`Field`, `data-invalid` on fields, `aria-invalid` on controls, and existing primitives before custom markup.
- Use Zod for any validation of forms, search params, route params, client-side content data, or API responses.
- Do not add web auth, Better Auth clients, tRPC, or `@leafcue/server` imports unless the task explicitly turns the marketing site into a server-backed app.
- Use `cn()` from `@leafcue/ui/lib/utils` when merging web classes.

## Server Rules

- Keep server changes isolated to explicit backend tasks.
- Server entrypoint: `apps/server/src/index.ts`.
- Request context: `apps/server/src/api/context.ts`.
- tRPC procedures: `apps/server/src/api/index.ts` and `apps/server/src/api/routers/*`.
- Auth: `apps/server/src/auth/index.ts`.
- Database: `apps/server/src/db/*`.
- If a future task connects a client to the server, update the server contract first, then consume exported server types from `@leafcue/server/...`.

## File And Routing Conventions

- Hooks: `use-*.ts`.
- Components: `kebab-case.tsx`.
- Native routes follow Expo Router conventions; keep files in `apps/native/app` thin.
- Web routes follow TanStack Router conventions; keep generated route files untouched unless regenerated.
- Move route-owned UI into `screens/<feature>/index.tsx` when native route files grow beyond simple composition.
- Prefer platform-specific files (`.ios.tsx`, `.android.tsx`, `.native.tsx`, `.web.tsx`) over large `Platform.select` branches.
- Colocate tests with the files they cover.

## Workflows

- Install from the repo root with `pnpm install`.
- `pnpm dev`: run the Turbo dev graph.
- `pnpm dev:native`: run the Expo app.
- `pnpm dev:web`: run the marketing site.
- `pnpm dev:server`: run the parked Worker.
- `pnpm check`: Biome lint and format with auto-fix (reads `biome.json` at the repo root).
- `pnpm check:ci`: same as `check` but read-only, no writes (for CI or verifying without changing files).
- `pnpm check-types`: run TypeScript checks across the monorepo.
- `pnpm build`: build all packages.
- Server database scripts: `pnpm db:push`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`, `pnpm db:local`.

## Quality Bar

- After completing substantive code changes, run from the repo root, in order: `pnpm check`, then `pnpm check-types`. Address failures before considering the work finished so formatting, lint, and types stay clean.
- Never use `any`; model types from Zod, Drizzle table inference, or server exports as appropriate.
- Keep changes small, typed, and aligned with the app split.
- Preserve offline behavior in native. A missing network must not block core plant care flows.
- Prefer existing dependencies and local patterns before adding new abstractions.
- Update schema, migrations, database helpers, UI, and tests together when changing persisted native data.
- Avoid expanding legacy template auth/tRPC paths. Remove or replace them when touching related local-first features.

## Reference Files

- `apps/native/app/_layout.tsx`: native root providers.
- `apps/native/lib/db/schema.ts`: native Drizzle schema.
- `apps/native/lib/db/index.ts`: native Drizzle database helpers.
- `apps/native/lib/db/provider.tsx`: Expo SQLite provider and migration gate.
- `apps/native/drizzle.config.ts`: native Drizzle Kit config.
- `apps/native/stores/use-theme-store.ts`: Zustand pattern.
- `apps/native/components/theme-store-sync.tsx`: theme sync pattern.
- `packages/ui/src/components/field.tsx`: shadcn field primitives.
- `packages/ui/src/components/input.tsx`: shadcn input primitive.
- `apps/web/src/routes/index.tsx`: marketing homepage.
- `apps/server/src/index.ts`: parked Worker entrypoint.
