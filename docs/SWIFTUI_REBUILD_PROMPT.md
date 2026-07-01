# Prompt: Rebuild Memoria as a native SwiftUI iOS app

Copy everything below the line into a fresh session (Claude Code, Cursor, etc.) pointed at a **new, empty Xcode project**. It is self-contained — the assistant does not need access to this Expo/React Native repo, only this document and the existing Supabase project.

---

## Context

You are rebuilding **Memoria**, currently a React Native (Expo v56) app, as a **100% native iOS app in SwiftUI**. Keep the existing Supabase backend as-is (Postgres schema, Auth, Storage, Realtime, Edge Functions) — only the client changes. Do not modify the database schema unless a section below explicitly says so.

Target: iOS 17+, Swift 6, SwiftUI + Swift Concurrency (`async/await`), no UIKit unless a SwiftUI gap forces it.

## Tech stack

| Layer | Choice |
|---|---|
| UI | SwiftUI (NavigationStack, TabView) |
| Language | Swift 6, strict concurrency |
| State | `@Observable` models (Observation framework) instead of Zustand stores |
| Backend SDK | [`supabase-swift`](https://github.com/supabase/supabase-swift) — Auth, Postgrest, Storage, Realtime |
| Local secure storage | Keychain (via `supabase-swift`'s built-in Keychain session storage) — never `UserDefaults` for tokens |
| Image loading/caching | `Kingfisher` or `NukeUI` (either is fine; pick one and use it consistently) |
| Push notifications | `UserNotifications` framework + APNs, registering the device token with the existing `send-push` Supabase Edge Function (see below — it needs a small adaptation) |
| Camera/photo picker | `PhotosUI` (`PhotosPicker`) for library picks, `AVFoundation`/`UIImagePickerController` bridge (or `AVCaptureSession` custom view) for the in-app camera capture button |
| Contacts | `Contacts` framework (`CNContactStore`) |
| Dependency management | Swift Package Manager only |

Do not introduce Combine-based patterns where `async/await` and `@Observable` suffice. Do not hand-roll a networking layer — use `supabase-swift`'s Postgrest query builder.

## Project structure

Mirror the existing app's separation of concerns:

```
Memoria/
├── MemoriaApp.swift                 # @main, root scene, boot hydration
├── App/
│   ├── RootView.swift                # Routing: splash → onboarding/auth/app
│   └── AppState.swift                # @Observable: session, profile, hydration flags
├── Models/
│   ├── Profile.swift
│   ├── Drop.swift
│   ├── DropParticipant.swift
│   ├── Photo.swift
│   ├── Friendship.swift
│   ├── Reaction.swift
│   └── Notification.swift
├── Services/                         # Equivalent of src/api/*.ts
│   ├── SupabaseClient.swift           # singleton client config
│   ├── DropsService.swift
│   ├── FriendsService.swift
│   ├── PhotosService.swift
│   ├── NotificationsService.swift
│   └── RealtimeService.swift
├── Stores/                           # @Observable, equivalent of src/store/*.ts
│   ├── AuthStore.swift
│   ├── DropsStore.swift
│   ├── FriendsStore.swift
│   └── NotificationsStore.swift
├── Features/
│   ├── Onboarding/                   # 4-slide first-launch tutorial
│   ├── Auth/                         # Sign in / sign up
│   ├── ProfileSetup/                 # 7-step post-signup onboarding
│   ├── Home/                         # Drop feed
│   ├── Friends/                      # Friend list, requests, search, contacts
│   ├── Calendar/                     # Paged "All Drops" / "My Drops" calendar
│   ├── CreateDrop/                   # New drop flow
│   ├── DropDetail/                   # Photo grid by uploader + camera capture
│   ├── Story/                        # Full-screen photo viewer with filmstrip
│   └── Profile/                      # My profile + settings
├── DesignSystem/
│   ├── Colors.swift
│   ├── Typography.swift
│   ├── Spacing.swift
│   ├── Radii.swift
│   └── Components/                    # InitialAvatar, GlassCard, Chip, etc.
└── Resources/
    └── Assets.xcassets
```

## Design system — port these tokens exactly

**Colors** (dark theme; `Colors.swift` as static `Color` constants):

```
background        #000000
surface           #161618
surfaceRaised     #242427
surfaceInput      #191919
surfaceDeep       #121212
surfaceGrouped    #1C1C1E
surfaceGroupedElevated #2C2C2E
surfaceCard       #2C2C2C

textPrimary       #F2EEE6
textSecondary     #B8B2A6
textTertiary      #6E6E73
textMuted         #898989
textLight         #C4C4C4
textPlaceholder   #8E8E93

borderDefault     #3B3B3B
borderSubtle      #252525

accent (ember)    #D6A45B
blue              #0A84FF
blueNotif         #3D8EFF
primary           #0044FF
success           #4CAF7D
error             #EA4942
warning           #F59E0B

ink               #000000
bone              #F2EEE6
white             #FFFFFF
charcoal          #1B1B1B
lightBackground   #F6F6F6   (used for the light-themed profile-setup flow)
```

Drop state colors (`STATE_META`): `active` → `#0044FF` "Collecting", `ready` → `#4CAF7D` "Ready", `open` → `#F59E0B` "Open", `expired` → `#626262` "Expired".

**Spacing scale** (points): `0, 4, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 80` — expose as a `Spacing` enum/struct so call sites read `Spacing.md` not raw numbers.

**Radii**: `sm 8, photo 10, md 12, lg 16, xl 24, full 9999`.

**Typography**: weights `regular 400 / medium 500 / semiBold 600 / strong 700 / bold 800`; sizes `xs 12 / sm 14 / body 15 / md 16 / lg 18 / xl 22 / 2xl 28`.

**Glass surfaces**: the RN app uses `expo-glass-effect` (iOS 26 Liquid Glass) with a solid-surface fallback. In SwiftUI, use the native `.glassEffect()` API (iOS 18+/26 Liquid Glass) where available, falling back to `.ultraThinMaterial`/`.regularMaterial` on older OS versions. Panel tint ≈ `rgba(255,255,255,0.08)` on dark backgrounds; floating chrome over photos uses `rgba(0,0,0,0.35)` fallback with a `rgba(255,255,255,0.2)` border.

Build this design system first, before any feature screens, so every screen consumes shared tokens/components rather than hardcoded values — this matches a hard rule from the original codebase (no hardcoded numeric styling values, always theme tokens).

## Data model (Supabase — do not change the schema)

Port these as `Codable` Swift structs matching the Postgres tables exactly (column names in `CodingKeys` snake_case → camelCase):

```swift
enum DropState: String, Codable { case active, ready, open, expired }
enum ParticipantStatus: String, Codable { case invited, accepted, declined, pending, removed }
enum FriendStatus: String, Codable { case pending, accepted, blocked }
enum NotificationType: String, Codable {
    case dropInvited = "drop_invited"
    case dropReady = "drop_ready"
    case dropOpened = "drop_opened"
    case dropOpeningSoon = "drop_opening_soon"
    case dropExpired = "drop_expired"
    case participantUploaded = "participant_uploaded"
    case friendRequest = "friend_request"
    case friendAccepted = "friend_accepted"
}
```

Tables → structs:
- **profiles**: `id (uuid, PK = auth.users.id)`, `username`, `display_name?`, `avatar_url?`, `phone?`, `bio?`, `age?`, `push_token?`, `created_at`, `updated_at`
- **drops**: `id`, `creator_id`, `title`, `thumbnail_url?`, `state (DropState)`, `open_date?`, `opened_at?`, `is_private`, `is_pinned`, `created_at`, `updated_at`
- **drop_participants**: `id`, `drop_id`, `user_id`, `status (ParticipantStatus)`, `invited_by?`, `has_uploaded`, `upload_count`, `joined_at`, `uploaded_at?`
- **photos**: `id`, `drop_id`, `uploader_id`, `storage_path`, `cdn_url`, `width?`, `height?`, `taken_at?`, `uploaded_at`, `sort_order`, `is_pinned`
- **friendships**: `id`, `requester_id`, `addressee_id`, `status (FriendStatus)`, `created_at`, `updated_at`
- **reactions**: `id`, `photo_id`, `user_id`, `emoji`, `created_at` (not yet used in any UI — table exists but the RN app has no reaction UI wired up; skip building UI for it unless asked)
- **notifications**: `id`, `user_id`, `type (NotificationType)`, `drop_id?`, `actor_id?`, `read`, `sent_push`, `created_at`

There's also a **`my_friends`** view (`friend_id`, `status`, `created_at`) — currently unused by the RN client (it queries `friendships` directly with joins instead); you can ignore it or use it if convenient.

Storage buckets: `photos` (drop thumbnails at `{dropId}/thumbnail.{ext}`, drop photos at `{dropId}/{timestamp}_{random}.{ext}`) and `avatars` (`{userId}/avatar.{ext}`). Allowed extensions: jpg/jpeg/png/heic/heif/webp. Max upload size: 50 MB.

## Environment / secrets

Store the Supabase URL and anon/publishable key in an untracked `Secrets.xcconfig` (gitignored) referenced from `Info.plist`, or in Xcode build settings — never hardcode them in source. Get the actual values from the existing Supabase project (same one the Expo app uses); do not create a new project.

## Auth flow (port exactly)

Email + password only (no OTP/phone auth in the current app despite `profiles.phone` existing — phone is just a contact-matching field, not an auth method).

1. App launch → boot hydration:
   - Read session from Keychain via `supabase-swift`.
   - If no session → has the user completed the first-launch tutorial before (a persisted local flag)? No → show 4-slide onboarding carousel. Yes → show sign-in/sign-up screen.
   - If session exists → fetch `profiles` row for `session.user.id`. Prefetch drops + friends + incoming/outgoing friend requests in parallel. Then:
     - No `display_name` on the profile → sign the user out and send back to sign-in (mirrors the RN app's defensive behavior for incomplete signups).
     - Has profile → mark tutorial seen, go straight to the main tab UI.
2. Sign-in/sign-up screen: single screen with a segmented Sign In / Sign Up toggle, email + password fields, a "Terms of Service" checkbox that must be checked to enable submit, and a submit button. Password minimum 6 characters on sign-up. On successful sign-up without an immediate session (email confirmation required), show "check your email" messaging instead of navigating.
3. Post-signup profile setup — a **7-step full-screen wizard** (this is the meatiest flow to port faithfully):
   1. **Name** — free text "What should friends call you?"
   2. **Username** — lowercase letters/digits/underscores, 3–30 chars, live availability check against `profiles.username` (debounced ~500ms) with inline "available"/"taken"/error states.
   3. **Profile photo** — optional, pick from library, upload to `avatars/{userId}/avatar.{ext}`.
   4. **Age** — optional numeric input, 1–120, skippable.
   5. **Phone number** — optional, skippable; on either continue or skip, upsert a `profiles` row early (id, username, display_name, phone?, avatar_url?, age?) so contact-matching can run against a real user id. Handle a unique-username race by suffixing a random 4-digit number and retrying on Postgres error code `23505`.
   6. **Contacts on Memoria** — request `Contacts` permission, read all contacts' phone numbers, normalize them (E.164-ish: keep `+` prefix if present, else assume a 10-digit number is US and prefix `+1`), look up matching `profiles.phone` values (excluding self), split into "On Memoria" (send friend request inline) vs "Invite Friends" (open Messages with a canned invite text via `sms:` URL scheme equivalent — `MFMessageComposeViewController` or a `sms:` URL). Skippable.
   7. **Enable notifications** — request `UNUserNotificationCenter` authorization, or skip. Either path navigates to a brief "Profile created ✓" confirmation screen that finalizes the profile upsert (using whatever name/username/avatar/age/phone was collected, falling back to auto-generating a username from the display name if somehow missing) and then routes into the main tab UI after ~1.4s.

   Visual: light theme (`lightBackground` background, `charcoal` text) for this whole wizard — it's the one light-themed flow in an otherwise all-dark app. Header shows a progress dots/bar (`step` of `total = 7`), a back chevron, and a skip button on skippable steps.

4. Session lifecycle: listen for Supabase auth state changes. On `SIGNED_OUT`, clear all local stores and route to sign-in. On `TOKEN_REFRESHED`, just update the stored session. Pause/resume Supabase's auto token-refresh based on app foreground/background state (`scenePhase`).

## Main app shell

Bottom tab bar, 4 visible tabs (native `TabView`, not custom):
1. **Home** — `house.fill` — drop feed
2. **Friends** — `person.2.fill`
3. **Calendar** — `calendar`
4. **Profile** — `person.fill`

Plus two tab-less pushed/modal flows: **Create Drop** (modal sheet or full-screen cover) and **Drop Detail → Story Viewer** (pushed from any drop card, full-screen).

## Feature: Home (drop feed)

- Vertical list of `DropCard`s for every drop the user created or is a participant in (creator + accepted/invited participants), newest-created first.
- Each `DropCard`: cover photo (thumbnail_url, falls back to a generated placeholder), title, a colored state pill (`STATE_META`), participant avatar stack, and — for locked/collecting drops — an open-date countdown or date.
- Pull-to-refresh re-fetches drops.
- Empty state: a big "Create your first drop" card with a background image (bring over `container_bg.png` from `assets/images/` or design an equivalent) and a CTA button that pushes the Create Drop flow.
- If notification permission was denied, show a dismissible-on-tap banner ("Turn on notifications to get updates on drops and friends") linking to Settings.app (`UIApplication.openSettingsURLString`).
- Footer, shown only when there's at least one drop: "All caught up ✨ / Until the next capsule cracks open."

## Feature: Create Drop

Two-step flow:
1. **Details form**: title text field, an "Opens" date picker (must be today or later; default tomorrow), and a scrollable friend-invite list (checkable rows, each friend toggled in/out of `invitedIds`). A checkmark toolbar button (enabled once title + date are set) opens the system camera to shoot a cover photo, then advances.
2. **Confirm screen**: shows the chosen cover photo, title, open date, and a comma-joined list of invited friends' names ("Just you" if none). A "Create drop" button performs, in order: `INSERT INTO drops`, upload the cover photo to Storage + `UPDATE drops.thumbnail_url`, `INSERT INTO drop_participants` for each invited friend (status `invited`). If either the thumbnail upload or the invite insert fails, delete the just-created drop row so you don't leave an orphaned/incomplete drop, then surface an error and let the user retry. On success, dismiss all the way back to Home.

## Feature: Drop Detail

- Photos grouped by uploader (`PhotosByUploader` in the RN app) in a grid, sorted pinned-first then by `sort_order` then `uploaded_at`.
- Header overlay (glass buttons): back chevron; a `•••` menu (creator only) with "Delete Drop" (destructive confirm alert; deletes the row, which cascades photos via FK).
- If the drop's `state` is `active` or `ready`, photos are **locked** — tapping one shows an alert instead of opening it ("Photos will be revealed when this drop opens"). Once `open`/`expired`, tapping a photo pushes the full-screen Story viewer at that photo's index.
- A floating shutter button (visible only to eligible participants while the drop is `active`/`ready`) opens the camera; on capture, upload via `PhotosService`, `INSERT INTO photos`, and mark the uploader's `drop_participants` row `has_uploaded = true`, `status = accepted`.
- Long-press or swipe actions per photo (creator or uploader): pin/unpin (`is_pinned`, re-sorts pinned-first), delete (removes Storage object + row, with optimistic UI + rollback + alert on failure).
- Live-updates via Realtime: subscribe to `INSERT` on `photos` filtered by `drop_id`, re-fetch and replace the photo list on any event.

## Feature: Story viewer

Full-screen, one photo at a time, `3:4` aspect card centered with rounded corners over a black backdrop:
- Tap left half of the photo → previous; tap right half → next, or dismiss if already on the last photo.
- Vertical drag-to-dismiss gesture: follows the finger, scales the card down as it's dragged, fades the background, springs back if released above threshold (~80pt or high velocity), otherwise animates off-screen and pops the view.
- Header overlay: back/down chevron, uploader avatar + name + relative "time ago", and a menu (pin toggle, "save" — currently a stub "coming soon" alert in the RN app, fine to leave as a stub or wire up to Photos library export).
- Bottom filmstrip: horizontal scroll of small thumbnails, current one highlighted with a border ring, auto-scrolls to keep the active thumbnail centered; tapping a thumbnail jumps to that photo.
- A reactions area exists in the RN UI as an empty placeholder ("No reactions yet") — replicate the empty state; full reaction picking is not implemented anywhere in the current app, so don't build it unless asked.

## Feature: Friends

- Search bar (debounced ~400ms, min 2 chars) queries `profiles` by `username`/`display_name` ilike, excluding self, limit 20.
- Not in search mode: an "Invite your friends" glass card (share sheet), a "Suggested" section (top 3 contacts-on-Memoria not already friended/pending, from the Contacts-matching flow — same normalization logic as onboarding step 6) with a "see all" link to a dedicated Contacts screen, an incoming "Requests" section (Accept/Decline), and the full friends list (name + "friends since" relative date).
- In search mode: results show a relationship-aware trailing chip — "Friends" / "Pending" / "Accept" (if they sent you a request) / "Add".
- Friend requests: `sendRequest` inserts a `friendships` row (`status default 'pending'`); `acceptRequest` updates to `accepted`; `declineRequest`/`cancelRequest` both just delete the row.

## Feature: Calendar

- Two horizontally-paged views ("All Drops" / "My Drops" — segmented header control synced to page position), each grouping the same drops by month of `open_date` (drops with no `open_date` grouped last under "No date"), rendered as a small grid of mini drop cards per month.

## Feature: Profile

- Avatar, display name, `@username`, bio, and a stats row (total drops / collecting / ready / open counts).
- Pinned drops section (if any) + all-drops grid, both as tappable mini cards; long-press or a pin icon toggles `is_pinned` optimistically.
- Settings screen (pushed via a gear toolbar button): "Sign Out" (destructive), and nothing else currently — keep it minimal, matching the source.

## Feature: Notifications

- A `notifications` list (bell icon, likely on the Home header) fetches the latest 50 for the user, newest first, joined with the actor's profile and the related drop's title/thumbnail/creator. Filter out any row whose type requires an actor (`drop_invited`, `participant_uploaded`, `friend_request`, `friend_accepted`) but has none (defensive — the actor profile might have been deleted).
- Unread count badge = count of `read = false`.
- Tapping a notification marks it read and deep-links: if it has a `drop_id`, push Drop Detail for that drop; if it's a friend-related type, jump to the Friends tab.
- Realtime: subscribe to `INSERT` on `notifications` filtered by the current user, re-fetch the list on any event.

## Push notifications

1. On login, register for remote notifications, get the APNs device token, and save it to `profiles.push_token`. **Note:** the existing Supabase Edge Function `supabase/functions/send-push/index.ts` currently sends via the **Expo push service** (`https://exp.host/--/api/v2/push/send`) and only accepts tokens starting with `ExponentPushToken`. Since the new client is a native app without Expo, you have two options — flag this decision to the user rather than silently picking one:
   - **(A)** Swap the client's push registration to obtain and store real **APNs tokens**, and update `send-push` to call Apple's APNs HTTP/2 API (or route through Firebase Cloud Messaging) instead of Expo's push service.
   - **(B)** Keep using Expo's push service purely as a push-delivery relay by continuing to register via `expo-notifications`' token format — not applicable once Expo is fully removed, so realistically (A) is the only real option for a "fully native, no Expo" rebuild.
   Plan on rewriting `send-push` to use APNs (via a `.p8` auth key, JWT-signed) as part of this rebuild; don't leave the Edge Function silently broken.
2. Notification types → title/body copy (port verbatim from the Edge Function): `drop_invited` → "New drop invitation" / "{actor} invited you to \"{title}\""; `drop_ready` → "Drop ready to open!" / "\"{title}\" is ready — open it now"; `drop_opened` → "Drop opened!" / "\"{title}\" is now open — see the photos"; `participant_uploaded` → "New photo added" / "{actor} added a photo to \"{title}\""; `friend_request` → "Friend request" / "{actor} sent you a friend request"; `friend_accepted` → "Friend request accepted" / "{actor} accepted your friend request".
3. Handle notification taps the same way as in-app notification-list taps (deep link by `drop_id` or to Friends).

## Realtime

Use `supabase-swift`'s Realtime `postgres_changes` API, mirroring the three RN subscriptions:
1. Per-signed-in-user channel: `drops` where `creator_id = me` (any event) and `drop_participants` where `user_id = me` (any event) → on any event, re-fetch that one drop by id and upsert it into the in-memory drops list (or remove it if it no longer exists / no longer includes me).
2. Per-signed-in-user channel: `notifications` INSERT where `user_id = me` → re-fetch the full notifications list.
3. Per-open-drop channel (while viewing Drop Detail): `photos` INSERT where `drop_id = <id>` → re-fetch that drop's photos.

Always tear down (`removeChannel`) subscriptions on sign-out / when leaving the relevant screen.

## Explicitly out of scope / do not build

- Reactions UI (table exists, no UI anywhere in the source app).
- Phone/OTP auth (the app is email+password only; `phone` is a contact-matching field, not a login method).
- Photo "save to library" from the Story viewer (currently a "coming soon" stub — leave it stubbed unless asked).
- Android — this rebuild is iOS-only.

## Suggested build order

1. Design system tokens + a couple of shared components (avatar, pill/chip, card) so screens aren't styled ad hoc.
2. `supabase-swift` client setup + Codable models + Keychain session persistence + boot hydration/routing skeleton (splash → auth vs. app).
3. Auth screen (sign in/up) end to end against the real Supabase project.
4. 7-step profile setup wizard.
5. Home tab + drop card + empty state (read-only first — list drops, no creation yet).
6. Create Drop flow (form → confirm → insert).
7. Drop Detail (photo grid, upload, lock/unlock logic) + Story viewer.
8. Friends tab (search, requests, contacts matching).
9. Calendar tab.
10. Profile tab + Settings.
11. Realtime subscriptions wired into all of the above.
12. Push notifications end-to-end, including the APNs rewrite of `send-push`.

Validate each stage against the real Supabase backend before moving to the next — the schema and RLS policies are already in production use by the Expo app, so don't guess at query shapes; the exact `select()` strings used by the current API layer are listed inline in each feature section above and should be replicated with `supabase-swift`'s Postgrest builder.
