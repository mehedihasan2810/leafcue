# Agent instructions

## Big picture

- This is a `pnpm` + Turborepo monorepo. Main apps live in `apps/web`, `apps/native`, and `apps/server`; shared packages live in `packages/ui` and `packages/config`.
- `apps/server` is the source of truth for backend contracts. Both web and native import `AppRouter` from `@app/server/api/routers/index` for end-to-end typed tRPC clients.
- The backend is a Cloudflare Worker built with Hono in `apps/server/src/index.ts`. It exposes Better Auth at `/api/auth/*` and tRPC at `/trpc/*`.
- Database access is centralized in `apps/server/src/db/index.ts` using Drizzle + libsql/Turso. Auth schema is exported from `apps/server/src/db/schema/auth.ts` via `schema/index.ts`.

## How data and auth flow

- Request context is created in `apps/server/src/api/context.ts`; auth is resolved by calling `auth.api.getSession()` from request headers.
- Public/protected tRPC procedures are defined in `apps/server/src/api/index.ts`. Add new server features by extending routers in `apps/server/src/api/routers/*` and exporting them through `appRouter`.
- Web uses cookie-based auth against the Worker via `apps/web/src/lib/auth-client.ts` and includes credentials on tRPC requests in `apps/web/src/router.tsx`.
- Native uses Better Auth Expo storage in `apps/native/lib/auth-client.ts` and manually forwards cookies in `apps/native/utils/trpc.ts`. Preserve that header logic when editing native auth or tRPC code.
- Protected web routes typically fetch the session before render and redirect in the route loader, e.g. `apps/web/src/routes/dashboard.tsx` together with `apps/web/src/functions/get-user.ts`.

## Repo-specific conventions

- Prefer importing server types from `@app/server/...` instead of duplicating API types in app code.
- Keep UI primitives shared in `packages/ui/src/components/*` when they are web-focused and reusable across screens; app-specific web composition belongs in `apps/web/src/components/*`.
- Native UI does **not** use `packages/ui`; it uses Expo/React Native + `heroui-native` components and `uniwind`/Tailwind-style classes.
- Utility class merging uses `cn()` from `packages/ui/src/lib/utils.ts` for web shared components.
- Environment access is done through local `env.ts` modules in each app. Follow the existing per-app env wrapper pattern instead of reading `process.env` directly throughout feature code.
- Keep auth cookie settings and trusted origins aligned with `apps/server/src/auth/index.ts`; this file contains important Worker/native/web compatibility decisions.

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
- If Expo Router API routes are used, group them under `app/api` and keep server-only helpers in `server/`. Shared backend contracts and business logic still belong in `apps/server` in this monorepo.
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

## Editing guidance

- When adding authenticated data access, update the server router first, then consume it from web/native through the shared `AppRouter` contract.
- When changing auth behavior, inspect all three places together: `apps/server/src/auth/index.ts`, `apps/web/src/lib/auth-client.ts`, and `apps/native/lib/auth-client.ts` / `apps/native/utils/trpc.ts`.
- When changing route structure on web, remember TanStack Start route files in `apps/web/src/routes/*` work with generated route types in `apps/web/src/routeTree.gen.ts`.
- Keep root providers intact: web wires React Query + tRPC in `apps/web/src/router.tsx`; native wires React Query and app providers in `apps/native/app/_layout.tsx`.
- Prefer small, type-safe changes that preserve the existing split: Worker/server logic in `apps/server`, browser UI in `apps/web`, device-specific UX in `apps/native`.

## Good reference files

- `apps/server/src/index.ts` - Worker entrypoint, CORS, auth and tRPC mounting
- `apps/server/src/api/index.ts` - `publicProcedure` and `protectedProcedure`
- `apps/server/src/auth/index.ts` - Better Auth, trusted origins, cookie strategy
- `apps/web/src/router.tsx` - web tRPC client + React Query wiring
- `apps/web/src/routes/dashboard.tsx` - protected route pattern
- `apps/native/utils/trpc.ts` - native cookie forwarding pattern for authenticated tRPC
- `apps/native/components/sign-in.tsx` - TanStack Form + Better Auth usage on mobile

**Using tRPC in Native/Web/Admin app (`apps/native`/`apps/web`):**

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
      Alert.alert("Error", error.message);
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

**CRITICAL: Never use `any` type. Always use proper types from the server.**

### Importing Server Types

The server exports types via `package.json` exports that clients can import:

```typescript
// tRPC types (procedure inputs/outputs)
import type { Outputs, Inputs } from "@giftwise/server/api/routers/index";
```

### Using tRPC Output Types

Use `Outputs` to get the exact return type of any tRPC procedure:

```typescript
import type { Outputs } from "@giftwise/server/api/routers/index";

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
