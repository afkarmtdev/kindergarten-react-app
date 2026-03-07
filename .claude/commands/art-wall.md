TRIGGER when: user mentions Art Wall, artwork, pin board, cork board, student artwork, ArtworkCard, ArtWallPage, ArtWallModal, pushpin, or asks to add, modify, or fix the art wall feature.

# art-wall — Art Wall Pin Board

A cork board-style page where teachers pin photos of student artwork. Each photo is slightly rotated with colorful pushpins, creating a tactile kindergarten feel.

## File Map

| File                 | Path                                | Role                                                          |
| -------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `ArtWallPage.tsx`    | `pages/art-wall/`                   | Admin page orchestrator — cork board grid, search, pagination |
| `ArtworkCard.tsx`    | `pages/art-wall/components/`        | Single pinned artwork card with pushpin + rotation            |
| `constants.ts`       | `pages/art-wall/`                   | `getRotation()`, `getPushpinColor()`, `PUSHPIN_COLORS`        |
| `ArtWallModal.tsx`   | `components/admin/`                 | Add/edit modal — photo upload, student picker, caption, date  |
| `StudentArtwork.tsx` | `pages/student-profile/components/` | Mini art gallery on student profile page                      |
| `artWallStore.ts`    | `store/`                            | Zustand store — page, search                                  |
| `artWall.ts`         | `backend/src/routes/`               | Backend CRUD + `/by-student/:studentId`                       |
| `artWall.test.ts`    | `backend/src/routes/`               | Backend integration tests                                     |

## Database

Table: `art_wall` — see `supabase-schema.sql`

| Column          | Type               | Notes                                                             |
| --------------- | ------------------ | ----------------------------------------------------------------- |
| `id`            | uuid PK            |                                                                   |
| `photo_url`     | text NOT NULL      | Supabase Storage `artwork-photos` bucket                          |
| `caption`       | text               | Optional, max 500 chars                                           |
| `student_id`    | uuid FK → students | Nullable, `on delete set null`                                    |
| `student_name`  | text               | Denormalised at insert time — artwork persists if student deleted |
| `artwork_date`  | date               | When the art was created (not uploaded)                           |
| `display_order` | int                | Default 0, ascending sort                                         |
| `is_visible`    | boolean            | Default true — anon RLS filters on this                           |
| `created_at`    | timestamptz        |                                                                   |

RLS: authenticated full CRUD, anon SELECT where `is_visible = true`.

## Cork Board Design

**Background texture (CSS only, no images):**

```
bg-amber-50 dark:bg-amber-950/30 rounded-3xl p-6 md:p-8
border border-amber-200/50 dark:border-amber-800/30
```

With inline radial-gradient for grain:

```ts
style={{
  backgroundImage: 'radial-gradient(circle, rgba(139,90,43,0.08) 1px, transparent 1px)',
  backgroundSize: '16px 16px',
}}
```

**Grid:** `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8`

## Pushpin System

Six kinder-\* colors cycled deterministically per item ID:

```
bg-kinder-orange, bg-kinder-blue, bg-kinder-green,
bg-kinder-yellow, bg-kinder-purple, bg-kinder-pink
```

Pushpin element: `w-5 h-5 rounded-full shadow-md border-2 border-white/50 dark:border-gray-700/50` with a `w-1.5 h-1.5 bg-white/50 rounded-full` highlight dot inside.

Positioned: `absolute -top-2.5 left-1/2 -translate-x-1/2 z-10`

## Rotation

Deterministic from item `id` via hash — NOT stored in DB.

```ts
function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return (hash % 7) - 3 // range: -3 to +3 degrees
}
```

Applied via inline `style={{ transform: rotate(...) }}` on the card wrapper.

Hover effect: `transition-transform duration-200 hover:rotate-0 hover:scale-105` — cards straighten and enlarge on hover.

## ArtworkCard

- Outer div: rotated via inline style, hover straighten effect
- Pushpin at top center (see above)
- Photo: `rounded-xl overflow-hidden aspect-[4/3] object-cover`
- Hidden items: `opacity-50` dim overlay
- Caption: small text below photo, truncated
- Student name: pill badge `bg-kinder-blue/10 text-kinder-blue text-xs px-2 py-0.5 rounded-full`
- Edit/Delete: ghost buttons with `Pencil` and `Trash2` icons
- Delete: local `showDelete` state + `DeleteDialog` (card-level pattern)

## ArtWallModal

Follows `GalleryModal.tsx` pattern. Fields:

1. Photo upload — required, `artwork-photos` bucket, `compressImage()` before upload
2. Caption — optional textarea, max 500
3. Student picker — `<select>` from `studentsApi.getAll({ limit: 100 })`, auto-sets `student_name`
4. Artwork date — optional date input
5. Display order — number, default 0
6. Visible toggle — Eye/EyeOff

Header icon: `Palette` with `bg-kinder-pink/10` circle. Submit button: `bg-kinder-pink`.

Includes: `useDiscardGuard` + `DiscardDialog`, mutation invalidates `['art-wall']`.

## Student Profile Integration

`StudentArtwork.tsx` renders between `AttendanceHeatmap` and `AttendanceHistoryTable` on the student profile page.

- Query: `['art-wall-student', studentId, page]` via `artWallApi.getByStudent()`, 6 per page
- Mini cork board with same rotation/pushpin treatment
- Grid: `grid-cols-2 sm:grid-cols-3 gap-4`
- No edit/delete — admin manages from Art Wall page
- Local `useState` for pagination (not Zustand)
- Empty: muted text, not full `EmptyState`

## Landing Page Section

"Our Little Artists" section in `LandingPage.tsx`, between Gallery and Notices.

- Hidden entirely when 0 items (same pattern as testimonials)
- Query: `['art-wall-public']` via `artWallApi.getPublic()`, staleTime 60s
- Background: `bg-amber-50 dark:bg-gray-900` with cork texture
- Masonry layout: `columns-2 md:columns-3 lg:columns-4 gap-5` with `break-inside-avoid mb-5`
- Up to 8 items, each with rotation + pushpin + hover effect
- Fade-in animation via `useFadeIn` with staggered delays

## API Endpoints

| Method | Path                                  | Auth | Notes                                          |
| ------ | ------------------------------------- | ---- | ---------------------------------------------- |
| GET    | `/api/art-wall`                       | Yes  | Paginated, search by caption/student_name      |
| GET    | `/api/art-wall/by-student/:studentId` | Yes  | Paginated, for student profile                 |
| GET    | `/api/art-wall/:id`                   | Yes  | Single item                                    |
| POST   | `/api/art-wall`                       | Yes  | Create, sanitised, auto-populates student_name |
| PUT    | `/api/art-wall/:id`                   | Yes  | Update, sanitised                              |
| DELETE | `/api/art-wall/:id`                   | Yes  | Delete                                         |
| GET    | `/api/public/art-wall`                | No   | Up to 12 visible items, for landing page       |

## Storage

Bucket: `artwork-photos` (public, Supabase Storage). Images compressed via `compressImage()` before upload (max 1200px, JPEG 0.82).

## Translation Keys

`artWall`, `artWallSubtitle`, `addArtwork`, `editArtwork`, `noArtwork`, `addFirstArtwork`, `artworkDate`, `selectStudent`, `artistName`, `ourLittleArtists`, `artWallLandingSubtitle`, `studentArtwork`

## Registration

- Route: `<Route path="art-wall">` in `App.tsx` (lazy-loaded)
- Sidebar: `{ to: '/admin/art-wall', icon: Palette, label: t('artWall') }` in `AdminLayout.tsx` (after gallery, before announcements)
- Backend: `app.route('/api/art-wall', artWall)` after authMiddleware in `index.ts`
- Public: `app.get('/api/public/art-wall', ...)` before authMiddleware in `index.ts`
