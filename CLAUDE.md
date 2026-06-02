# Memoria — AI Assistant Guide

> **Critical:** Expo has changed significantly. Always read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any Expo-related code.

---

## Project Overview

Memoria is a mobile app (iOS + Android) built with **Expo v56** (managed workflow) and **React Native 0.85**. It's a social photo-sharing app where users create "drops" — time-locked photo capsules that unlock on a set date. Friends are invited to upload photos to a drop before it opens.

**Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo v56.0.5 (managed) |
| Runtime | React 19.2.3 / React Native 0.85.3 |
| Language | TypeScript 6.0.3 (strict mode) |
| Routing | Expo Router 56.2.7 (file-based) |
| State | Zustand 5.0.13 |
| Backend | Supabase (auth, db, storage, realtime) |
| Icons | lucide-react-native + @expo/vector-icons + expo-symbols |
| Styling | React Native StyleSheet (no CSS framework) |
| Notifications | expo-notifications + Supabase Realtime |
| Edge Functions | Deno (Supabase) |

---

## Directory Structure

```
Memoria/
├── src/
│   ├── app/                    # Expo Router screens (file-based routing)
│   │   ├── _layout.tsx         # Root layout: auth hydration, routing guard
│   │   ├── (onboarding)/       # First-launch tutorial (4 steps)
│   │   ├── (auth)/             # Phone OTP, email, password, profile setup
│   │   └── (app)/              # Main app — bottom tab navigation
│   │       ├── _layout.tsx     # NativeTabs with 5 tabs
│   │       ├── (home)/         # Feed of drops
│   │       ├── (friends)/      # Friend management
│   │       ├── (create)/       # Create new drop
│   │       ├── (calendar)/     # Calendar view of drops
│   │       ├── (profile)/      # User profile
│   │       └── drop/           # Drop detail: [id].tsx, gallery.tsx, upload.tsx
│   ├── components/
│   │   ├── ui/                 # Atomic: Button, BigInput, AuthStepLayout, Dots, InfoRow, Onboarding*
│   │   ├── drops/              # DropCard
│   │   └── friends/            # UserRow, Chip
│   ├── api/
│   │   ├── client.ts           # Supabase client (SecureStore adapter)
│   │   ├── drops.api.ts        # Drop CRUD, photos, participants
│   │   ├── friends.api.ts      # Friend requests, user search
│   │   ├── notifications.api.ts
│   │   ├── photos.api.ts
│   │   └── realtime.ts         # Postgres Change subscriptions
│   ├── store/                  # Zustand stores
│   │   ├── auth.store.ts       # session, user, profile, onboarding state
│   │   ├── drops.store.ts      # drops list, draft form state
│   │   ├── friends.store.ts    # friends, requests, search results
│   │   └── notifications.store.ts
│   ├── hooks/
│   │   ├── useDrops.ts         # load, create, invite logic
│   │   ├── useFriends.ts
│   │   └── useNotifications.ts # push token registration, listeners
│   ├── lib/
│   │   └── auth/
│   │       ├── providers.ts    # Phone OTP, Apple/Google OAuth stubs
│   │       └── sessions.ts     # SecureStore adapter for Supabase
│   ├── theme/
│   │   ├── index.ts            # Re-exports all tokens
│   │   ├── colors.ts           # Dark palette (ink, bone, ember, semantic)
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── radii.ts
│   │   └── shadows.ts
│   └── types/
│       └── database.types.ts   # Auto-generated from Supabase schema — DO NOT edit manually
├── supabase/
│   └── functions/
│       └── send-push/
│           └── index.ts        # Deno edge function: sends Expo push notifications
├── assets/
│   └── images/                 # App icons, splash screen
├── app.json                    # Expo config
├── package.json
└── tsconfig.json
```

---

## Path Aliases

Defined in `tsconfig.json`:
- `@/*` → `./src/*`
- `@/assets/*` → `./assets/*`

Always use these aliases — never use relative `../../` imports that cross the `src/` boundary.

---

## Authentication Flow

1. App launches → `src/app/_layout.tsx` calls `bootHydrate()`
2. `bootHydrate()` reads Supabase session (stored via SecureStore adapter), fetches profile, checks AsyncStorage for onboarding flag
3. Routing decision:
   - No session → `/(auth)/sign-in`
   - Session but no username → `/(auth)/setup-profile`
   - Session, profile, but no onboarding seen → `/(onboarding)`
   - All good → `/(app)`
4. Real-time auth listener handles `SIGNED_OUT` and `TOKEN_REFRESHED` events

**Token storage:** Tokens are stored in `expo-secure-store` via a custom adapter (`src/lib/auth/sessions.ts`). Never store tokens in AsyncStorage.

---

## State Management

Each domain has a Zustand store. The pattern:

```ts
// Read state
const user = useAuthStore(selectUser);

// Mutate imperatively (from API modules or hooks)
useAuthStore.getState().setProfile(profile);
```

- Stores export `selectX` selector helpers to prevent unnecessary re-renders
- API calls dispatch to stores via `store.getState()` for imperative updates outside React
- Never put derived state in stores — compute it at the call site or in a selector

---

## API Layer

All Supabase calls live in `src/api/`. Pattern:

```ts
export async function getDropById(id: string) {
  const { data, error } = await supabase
    .from('drops')
    .select('...')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
```

- The Supabase client is a singleton in `src/api/client.ts`
- Types come from `src/types/database.types.ts` — regenerate with `npx supabase gen types typescript` after schema changes
- Environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## Realtime Subscriptions

`src/api/realtime.ts` sets up Postgres Change subscriptions. Pattern:

```ts
export function subscribeToDrop(dropId: string) {
  const channel = supabase
    .channel(`drop:${dropId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'photos', filter: `drop_id=eq.${dropId}` }, handler)
    .subscribe();
  return () => supabase.removeChannel(channel); // cleanup
}
```

Always return and call the cleanup function on component unmount.

---

## Database Schema

Key tables (full types in `src/types/database.types.ts`):

| Table | Purpose |
|---|---|
| `profiles` | id, username, display_name, avatar_url, phone, bio, push_token |
| `drops` | id, creator_id, title, thumbnail_url, state (`active\|ready\|open\|expired`), open_date, opened_at, is_private |
| `drop_participants` | drop_id, user_id, status (`invited\|accepted\|declined\|pending\|removed`), has_uploaded, upload_count |
| `friendships` | requester_id, addressee_id, status (`pending\|accepted\|blocked`) |
| `photos` | drop_id, user_id, url, created_at |
| `notifications` | user_id, type (`drop_invited\|drop_ready\|drop_opened\|participant_uploaded\|friend_request\|friend_accepted`), read, sent_push |

---

## Styling & Theme

All styles use `React Native StyleSheet.create()`. Never use inline style objects.

**Dark theme palette** (import from `@/theme`):
```ts
colors.ink          // #0E0E10 — primary background
colors.bone         // #F2EEE6 — primary text
colors.ember        // #D6A45B — accent/gold

// Semantic tokens (prefer these):
colors.background
colors.surface
colors.surfaceRaised
colors.textPrimary
colors.textSecondary
colors.textTertiary
colors.accent
```

Use `spacing`, `radii`, `typography`, and `shadows` tokens from `@/theme` — do not hardcode numeric values.

---

## Navigation

- **Root:** Expo Router `Slot` in `_layout.tsx`
- **Auth flow:** Stack navigator (no headers) in `src/app/(auth)/_layout.tsx`
- **Onboarding flow:** Stack navigator in `src/app/(onboarding)/_layout.tsx`
- **Main app:** `NativeTabs` with 5 visible tabs + 1 hidden route group `(drop/)` for detail pages
- **Programmatic nav:** Use `router.replace()` for auth transitions, `router.push()` for drill-down

Expo Router v56 uses typed routes (`app.json` → `typedRoutes: true`). Pass route params through `router.push({ pathname: '/drop/[id]', params: { id } })`.

---

## Push Notifications

1. `useNotifications.ts` registers the device's Expo push token and saves it to `profiles.push_token`
2. Supabase triggers (or server logic) call the `send-push` edge function
3. The edge function (`supabase/functions/send-push/index.ts`) calls the Expo Push API
4. The app handles `addNotificationResponseReceivedListener` to deep-link into the relevant screen

---

## Development Commands

```bash
# Start dev server
npx expo start

# Start for specific platform
npx expo start --ios
npx expo start --android

# Lint (no eslint config — relies on VSCode editor actions)
# TypeScript type-check
npx tsc --noEmit

# Regenerate Supabase types after schema changes
npx supabase gen types typescript --project-id <id> > src/types/database.types.ts

# Deploy edge function
npx supabase functions deploy send-push
```

---

## Key Conventions

1. **Read Expo v56 docs first.** The API surface changes between Expo versions. Check https://docs.expo.dev/versions/v56.0.0/ before using any Expo API.
2. **Never edit `database.types.ts` by hand.** Regenerate it from the Supabase schema.
3. **Use typed routes.** Avoid string literals for route paths; use typed params.
4. **SecureStore for tokens.** Never use AsyncStorage for auth tokens.
5. **Zustand selectors.** Always use selector functions (`useStore(selectX)`) to prevent full-store re-renders.
6. **Cleanup realtime subscriptions.** Always return and invoke the cleanup function from subscription setup.
7. **No test framework.** There are no tests currently. Write testable, pure logic in `src/api/` and `src/store/` but don't add a test runner without discussion.
8. **No linter config.** VSCode handles formatting on save. Don't add ESLint/Prettier configs without discussion.
9. **React Compiler is enabled** (`app.json` → `reactCompiler: true`). Do not manually add `useMemo`/`useCallback` — the compiler handles memoization. If you encounter a compiler error, fix the source rather than disabling the compiler for that file.

---

## Expo v56 Specifics

- **File-based routing** via Expo Router — screens live in `src/app/`, not a `screens/` folder
- **`NativeTabs`** is the v56 way to create native bottom tab bars (not `@react-navigation/bottom-tabs`)
- **`expo-symbols`** provides SF Symbols support on iOS
- **Managed workflow** — no `android/` or `ios/` native directories; use `npx expo prebuild` only if absolutely necessary
- **React 19** — use the new `use()` hook and concurrent features where appropriate; avoid legacy patterns like `componentDidMount`
