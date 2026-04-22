# Agent instructions

## Big picture

- This is a `pnpm` + Turborepo monorepo. Main apps live in `apps/web`, `apps/native`, and `apps/server`; shared packages live in `packages/ui` and `packages/config`.
- `apps/server` is the source of truth for backend contracts used by server-backed clients such as `apps/web`. Do **not** treat `apps/native` as a server-backed client right now.
- `apps/native` is currently a local-first Expo React Native app. Its primary data layer is local WatermelonDB in `apps/native/lib/watermelon/*`. It has no backend dependency and no auth flow at this stage.
- Native may use `apps/server` in the future, but only add server/tRPC/auth integration to `apps/native` when the task explicitly asks for that migration or feature.
- The backend is a Cloudflare Worker built with Hono in `apps/server/src/index.ts`. It exposes Better Auth at `/api/auth/*` and tRPC at `/trpc/*`.
- Database access is centralized in `apps/server/src/db/index.ts` using Drizzle + libsql/Turso. Auth schema is exported from `apps/server/src/db/schema/auth.ts` via `schema/index.ts`.

## How data and auth flow

- Request context is created in `apps/server/src/api/context.ts`; auth is resolved by calling `auth.api.getSession()` from request headers.
- Public/protected tRPC procedures are defined in `apps/server/src/api/index.ts`. Add new server features by extending routers in `apps/server/src/api/routers/*` and exporting them through `appRouter`.
- Web uses cookie-based auth against the Worker via `apps/web/src/lib/auth-client.ts` and includes credentials on tRPC requests in `apps/web/src/router.tsx`.
- Protected web routes typically fetch the session before render and redirect in the route loader, e.g. `apps/web/src/routes/dashboard.tsx` together with `apps/web/src/functions/get-user.ts`.
- Native data should be modeled locally first in WatermelonDB. Add or change tables in `apps/native/lib/watermelon/schema.ts`, add migration steps in `apps/native/lib/watermelon/migrations.ts`, register model classes in `apps/native/lib/watermelon/database.ts`, and consume the database through WatermelonDB APIs/hooks from the `DatabaseProvider` in `apps/native/app/_layout.tsx`.
- Native should not introduce Better Auth, tRPC, cookie forwarding, or imports from `@app/server` unless the user explicitly asks to connect native to a backend.
- WatermelonDB is a native module. Native development should use an Expo prebuild/custom development build or EAS build; Expo Go will not include the WatermelonDB native module.

## Repo-specific conventions

- For server-backed clients, prefer importing server types from `@app/server/...` instead of duplicating API types in app code.
- For `apps/native`, prefer local WatermelonDB model/schema types and app-owned types. Do not import server router types into native unless native is intentionally being connected to the backend.
- Keep UI primitives shared in `packages/ui/src/components/*` when they are web-focused and reusable across screens; app-specific web composition belongs in `apps/web/src/components/*`.
- Native UI does **not** use `packages/ui`; it uses Expo/React Native + `heroui-native` components and `uniwind`/Tailwind-style classes.
- Forms in `apps/native` must use TanStack Form (`@tanstack/react-form`) + Zod validation + HeroUI Native form UI components from `heroui-native`. Do not build native forms with raw `TextInput`/`Pressable` UI when a HeroUI Native form/control component fits.
- Forms in `apps/web` must use TanStack Form (`@tanstack/react-form`) + Zod validation + shadcn form UI components from the existing shadcn setup, primarily `packages/ui/src/components/*`. Do not build web forms with raw input/layout markup when shadcn form components fit.
- Native app state must use Zustand stores instead of React Context. Put stores in `apps/native/stores/use-*.ts`, expose typed selector-friendly hooks, and select the smallest state slice a component needs.
- Do not create React Context providers for native app state. React Context is only acceptable when a third-party library requires its provider or when doing explicit dependency injection that cannot be represented as a Zustand store.
- Native dependencies with native code must be listed in `apps/native/package.json` so Expo/React Native autolinking can find them in this monorepo.
- Utility class merging uses `cn()` from `packages/ui/src/lib/utils.ts` for web shared components.
- Environment access is done through local `env.ts` modules in each app. Follow the existing per-app env wrapper pattern instead of reading `process.env` directly throughout feature code.
- Keep auth cookie settings and trusted origins aligned with `apps/server/src/auth/index.ts` for web/server work. This does not apply to native while native has no auth.

3. **File naming**:
   - Hooks: `use-*.ts` (kebab-case)
   - Components: `kebab-case.tsx`
   - Routes: Follow TanStack/Expo Router conventions

## Expo Router native structure

- Prefer a `src/`-based Expo Router layout for new native work: `src/app` for routes, `src/screens` for route-owned UI, `src/components` for reusable UI, `src/hooks` for reusable hooks, `src/utils` for pure helpers, and `src/server` for server-only code used by Expo API routes.
- If the repo already uses root `app/`, `components/`, `hooks/`, or `lib/`, preserve that layout unless the task is an explicit migration, but keep the same separation of concerns.
- Keep files in `app` thin. They should mainly handle layouts, params, redirects, and route composition. Do not place reusable components, hooks, or helpers inside `app` because every file there participates in routing.
- Move route-specific UI into `screens/<feature>/index.tsx` with colocated private pieces when a route grows beyond a small file.
- Use a folder with an `index.tsx` entry when a screen or component needs private subfiles.
- If Expo Router API routes are used in the future, group them under `app/api` and keep server-only helpers in `server/`. Do not add native API routes for current local-first features.
- Prefer platform-specific files such as `.web.tsx`, `.native.tsx`, `.ios.tsx`, and `.android.tsx` over large `Platform.select` branches when implementations materially differ.
- Colocate tests with the files they cover, and keep styles in the component file unless platform splits or file size justify extraction.

## Workflows that matter

- Install dependencies from the repo root with `pnpm install`.
- Common root scripts from `package.json`:
  - `pnpm dev` runs the turbo dev graph.
  - `pnpm dev:web`, `pnpm dev:native`, `pnpm dev:server` run one app.
  - `pnpm build` builds all packages.
  - `pnpm check-types` runs TypeScript checks across the monorepo.
- Server/database scripts are routed through the root into `apps/server`: `pnpm db:push`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`, `pnpm db:local`.
- Server dev/build/deploy use Wrangler (`apps/server/package.json`); web deploy also uses Wrangler after `vite build` (`apps/web/package.json`).
- Native WatermelonDB changes require a custom native build to test on device/simulator: use `pnpm --filter native android`, `pnpm --filter native ios`, or an EAS build. `pnpm dev:native`/Expo Go is not enough after native module changes.

## Editing guidance

- When adding web authenticated data access, update the server router first, then consume it from web through the shared `AppRouter` contract.
- When changing web/server auth behavior, inspect `apps/server/src/auth/index.ts` and `apps/web/src/lib/auth-client.ts` together.
- When adding native data access, start with WatermelonDB schema, migrations, and models in `apps/native/lib/watermelon/*`. Keep reads/writes local unless the task explicitly introduces sync or backend integration.
- Do not add native sign-in/sign-up screens, Better Auth clients, tRPC clients, cookie forwarding, or `@app/server` imports for native local-first features.
- Treat any existing native auth/tRPC files as legacy template leftovers unless a task explicitly revives backend integration. Do not expand those paths for local-first native work.
- When adding or editing forms in `apps/native`, use TanStack Form for form state/submission, Zod for validation schemas, and HeroUI Native controls such as `TextField`, `Label`, `Input`, `FieldError`, `Button`, and `Spinner`. Keep schemas close to the form unless they are genuinely shared.
- When adding or editing forms in `apps/web`, use TanStack Form for form state/submission, Zod for validation schemas, and shadcn components such as `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Button`, and `Spinner` from the existing UI component paths.
- For all forms, show validation through the platform UI components, wire disabled/pending states from TanStack Form state, and keep submit handlers typed from the Zod schema instead of using `any`.
- When adding native app state, create or extend a Zustand store under `apps/native/stores`. Prefer separate small stores by domain, keep actions in the store, derive booleans/labels in selectors, and avoid subscribing components to whole-store objects.
- Do not add React Context for native state management. If a library provider must remain in `apps/native/app/_layout.tsx`, keep it as integration wiring and keep app-owned mutable state in Zustand.
- When changing route structure on web, remember TanStack Start route files in `apps/web/src/routes/*` work with generated route types in `apps/web/src/routeTree.gen.ts`.
- Keep root providers intact: web wires React Query + tRPC in `apps/web/src/router.tsx`; native wires WatermelonDB, Zustand sync components, and required third-party providers in `apps/native/app/_layout.tsx`.
- Prefer small, type-safe changes that preserve the existing split: Worker/server logic in `apps/server`, browser UI in `apps/web`, local-first device UX in `apps/native`.

## Good reference files

- `apps/server/src/index.ts` - Worker entrypoint, CORS, auth and tRPC mounting
- `apps/server/src/api/index.ts` - `publicProcedure` and `protectedProcedure`
- `apps/server/src/auth/index.ts` - Better Auth, trusted origins, cookie strategy
- `apps/web/src/router.tsx` - web tRPC client + React Query wiring
- `apps/web/src/routes/dashboard.tsx` - protected route pattern
- `packages/ui/src/components/field.tsx` - shadcn field/form layout primitives for web
- `packages/ui/src/components/input.tsx` - shadcn input primitive for web forms
- `apps/native/lib/watermelon/schema.ts` - native local WatermelonDB schema
- `apps/native/lib/watermelon/migrations.ts` - native WatermelonDB migrations
- `apps/native/lib/watermelon/database.ts` - native WatermelonDB adapter/database setup
- `apps/native/plugins/with-watermelondb.js` - Expo prebuild plugin for WatermelonDB native wiring
- `apps/native/stores/use-theme-store.ts` - native Zustand store pattern
- `apps/native/app/_layout.tsx` - native root providers, including WatermelonDB

**Using Zustand in native (`apps/native`):**

- Use Zustand for app-owned global or shared state. Do not use React Context for this.
- Create typed stores with `create<State>()(...)` from `zustand`.
- Store only the minimal source of truth; derive values through selectors such as `selectIsLightTheme`.
- Components should subscribe with selectors like `useThemeStore((state) => state.toggleTheme)` instead of reading the entire store.
- Keep side-effectful integration sync, such as syncing Uniwind theme into a store, in small components like `apps/native/components/theme-store-sync.tsx`.

**Using WatermelonDB in native (`apps/native`):**

- Add tables in `apps/native/lib/watermelon/schema.ts` and bump the schema version when the on-device schema changes.
- Add matching migration steps in `apps/native/lib/watermelon/migrations.ts` for every schema version bump after data has shipped.
- Add WatermelonDB `Model` classes under native-owned folders, then register them in `apps/native/lib/watermelon/database.ts`.
- Keep WatermelonDB writes inside `database.write(...)` and keep database access behind small hooks/helpers when screens need derived data.

**Using Forms:**

- Native forms: TanStack Form + Zod + HeroUI Native components. Fetch HeroUI Native component docs before composing unfamiliar form controls.
- Web forms: TanStack Form + Zod + shadcn components. Follow the shadcn form rules: use `FieldGroup`/`Field` composition, `data-invalid` on fields, `aria-invalid` on controls, and existing UI primitives before custom markup.
- Zod schemas should be the validation source of truth. Use `z.infer` or TanStack Form inference where helpful so submitted values stay typed.
- Prefer field-level subscriptions/selectors from TanStack Form so forms do not rerender wholesale on every keystroke.

**Using tRPC in server-backed web code (`apps/web`):**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

const queryClient = useQueryClient();

// Query - use useQuery + trpc.queryOptions()
const { data, isPending, error } = useQuery(trpc.healthCheck.queryOptions()); // IMPORTANT: DO NOT USE isLoading, use isPending instead
const { data: user } = useQuery(trpc.users.get.queryOptions());

// Query with parameters
const { data: post } = useQuery(trpc.posts.get.queryOptions({ id: postId }));

// Mutations - define with useMutation + trpc.mutationOptions()
const createUser = useMutation(
  trpc.users.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.users.list.queryKey() });
    },
    onError: (error) => {
      console.error(error.message);
    },
  }),
);

// Call mutation
createUser.mutate({ name: "John" });

// Check mutation state
createUser.isPending; // loading state
createUser.isError; // error state

// Invalidating queries after mutations
queryClient.invalidateQueries({ queryKey: trpc.users.list.queryKey() }); // invalidate list
queryClient.invalidateQueries({ queryKey: trpc.users.get.queryKey() }); // invalidate all .get queries
queryClient.invalidateQueries({
  queryKey: trpc.users.get.queryKey({ id: "123" }),
}); // specific query
```

## End-to-End Type Safety

**CRITICAL: Never use `any` type. Use proper server types for server-backed web code and proper local model/schema types for native code.**

### Importing Server Types

The server exports types via `package.json` exports that server-backed clients can import. Do not import these into `apps/native` while native remains local-first.

```typescript
// tRPC types (procedure inputs/outputs)
import type { Outputs, Inputs } from "@app/server/api/routers/index";
```

### Using tRPC Output Types

Use `Outputs` to get the exact return type of any tRPC procedure:

```typescript
import type { Outputs } from "@app/server/api/routers/index";

// Get the full return type of a procedure
type FavoritesResponse = Outputs["music"]["favorites"]["list"];

// Get a single item from an array response
type FavoriteItem = Outputs["music"]["favorites"]["list"][number];

// Use in component
const playTrack = async (track: FavoriteItem) => {
  // TypeScript knows all properties of track
};
```

### Common Patterns

```typescript
// Array item type
type HistoryItem = Outputs["music"]["history"]["getRecentlyPlayed"][number];

// Partial property access
type TrackId = Outputs["music"]["tracks"]["getById"]["id"];

// Function parameter from procedure output
const handlePlaylistTrack = (
  pt: Outputs["music"]["playlists"]["getById"]["tracks"][number]
) => { ... };
```
