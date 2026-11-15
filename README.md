# Waymark

A private, visual travel journal. Save a place you visited in seconds — a place and a photo is enough — then find
it again by browsing your journal, wandering your own map, or opening a trip.

No public profiles, followers, likes or feeds. Private by default.

## Stack

- Next.js 16 (App Router, TypeScript, Cache Components)
- Tailwind CSS 4 + shadcn/ui (Base UI primitives)
- Supabase — Postgres, Auth, Storage
- Mapbox GL JS + Search Box API
- React Hook Form + Zod
- Deploys to Vercel

## Running locally

```bash
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Needed for | Without it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Accounts and cloud storage | Sign-in is off; the sample-data demo is used |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) | Same | Same |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Interactive maps and place search | Manual place entry and a simplified, keyboard-accessible pin map |

All three are public, browser-safe values. **The Supabase service-role key is never used by this app** and should not
be added to it. Account deletion runs through a `security definer` SQL function that can only delete the caller.

## Demo mode

"Explore the demo" works with or without Supabase. It loads the journal of "Ama", an Accra-based traveller: 21
memories over two years across four trips (Marrakech, Isle of Skye, Kyoto, Lisbon), plus loose memories at home and
in Slovenia. Two Ghana memories are deliberately left out of a trip so Waymark suggests grouping them, and one
memory has no photo so that state can be seen. Every change saves to this browser only:

- memories, trips and profile → `localStorage` (`waymark:demo:v2`)
- photos you add → IndexedDB (`waymark-demo`)
- sample photos → real photos of each place from Wikimedia Commons, bundled in `public/demo/` (resized to 1200 px)
  so the demo works offline. Authors and licences are in `seedPhotoCredits` in `src/lib/data/seed.ts`, shown under
  each photo in the app and in the landing page footer.

A badge in the sidebar and top bar always shows whether you're in the demo or your private cloud journal.
Settings → *Reset sample data* restores the original demo.

## Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/20261115000000_init.sql` — either `supabase db push` with the
   Supabase CLI linked to your project, or paste it into the SQL editor.
3. Auth → URL configuration: set the Site URL to your deployment, and add `https://<your-domain>/journal` (and
   `http://localhost:3000/journal`) to the redirect URLs so email confirmation links land in the app.
4. Copy the project URL and anon/publishable key into `.env.local` (and into Vercel's environment variables).

### Running Supabase locally

With Docker running, `npx supabase start` starts a local stack and applies the migration. For the app, put the
printed API URL and anon key in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from `npx supabase status`>
```

Email confirmation is off locally, so new accounts sign in straight away.

### Data model

| Table | Columns |
| --- | --- |
| `profiles` | `id` (= auth user), `display_name`, `approximate_location`, `created_at` |
| `trips` | `id`, `user_id`, `name`, `start_date`, `end_date`, `cover_photo_path`, `created_at` |
| `memories` | `id`, `user_id`, `trip_id?`, `place_name`, `address`, `latitude`, `longitude`, `visited_on`, `note`, `photo_path`, `tags[]`, `created_at`, `updated_at` |

Indexes cover `(user_id, visited_on desc)`, `trip_id`, `(user_id, lower(place_name))`, `(user_id, start_date desc)`
and a GIN index on `tags`. Deleting a trip sets its memories' `trip_id` to null. Deleting a user cascades to
everything they own.

### Row Level Security

RLS is enabled on every table. Each policy is limited to the `authenticated` role.

| Table | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `profiles` | `id = auth.uid()` | `id = auth.uid()` | `id = auth.uid()` | — (cascades from auth user) |
| `trips` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `memories` | `user_id = auth.uid()` | owner, **and** `trip_id` must be null or a trip the same user owns | same as insert | `user_id = auth.uid()` |
| `storage.objects` (bucket `memory-photos`) | first path segment = `auth.uid()` | same | same | same |

The `memory-photos` bucket is private (15 MB limit, image types only). Photos are stored at `<user id>/<uuid>.jpg` and
shown through signed URLs that expire after an hour. Before upload, photos are resized and re-encoded, which drops
EXIF metadata such as GPS for formats the browser can decode.

`public.delete_account()` deletes `auth.users` where `id = auth.uid()`. Only `authenticated` can execute it. The app
removes the user's photo files through the Storage API first, because storage rows can't be deleted with SQL.

## Mapbox

Create a public token at [account.mapbox.com](https://account.mapbox.com) and restrict it to your domains. Waymark uses:

- Mapbox GL JS (`light-v11` style), with clustered pins that open a preview card
- the Search Box API `/forward` endpoint for place search, and `/reverse` for "Use my location"

If the token is missing, or the map fails to load (for example with WebGL disabled), Waymark falls back to manual
place entry and a simplified projected map. That map still clusters pins, zooms, and keeps every pin reachable by
keyboard.

## Deploying to Vercel

1. Import the repository in Vercel. The framework preset is detected automatically.
2. Add the environment variables above for Production and Preview.
3. Deploy, then add the production URL to Supabase's auth redirect URLs.

## Testing

| Command | What it checks | Needs |
| --- | --- | --- |
| `npm test` | Search and filters, trip suggestions, validation, geo and date helpers, and that the demo data is consistent, credited and valid | Nothing |
| `npm run test:db` | The real schema on Postgres: each person sees and edits only their own rows, can't write into someone else's trip, photos stay in the owner's folder, invalid values are rejected, and account deletion removes everything | `npx supabase start` (skipped otherwise) |
| `npm run test:e2e` | The app in Chromium: demo browsing, adding with a photo, editing, search, delete with undo, trip suggestions, moving memories, map preview, the phone layout, and the full signed-in flow with a real photo upload, export and account deletion | `npm run build` first; the signed-in test also needs the app built against local Supabase and `NEXT_PUBLIC_SUPABASE_URL` set when running |

Also `npm run lint` and `npm run typecheck`.

## Project layout

```
src/
  app/
    page.tsx               landing
    auth/                  sign in / sign up
    (app)/                 signed-in or demo area, behind AppGate
      journal/             home: greeting, recent, timeline/grid, search and filters, map and trips glance
      map/                 full map with a place list (desktop) and full-screen toggle (mobile)
      trips/  trips/[id]   trips, suggestions, editing, moving memories
      memories/new  [id]  [id]/edit
      settings/            profile, privacy, export, delete
  components/
    providers/             SessionProvider (mode + auth), DataProvider (state, optimistic updates, undo)
    map/                   Mapbox map, fallback map, preview card
    memory-form/           quick-add form, place search, location, photo upload, tags
  lib/
    data/                  Repository interface, demo (local) and cloud (Supabase) implementations, seed data
    schema.ts              Zod schemas
    trips.ts               trip suggestions (≤3 days and ≤250 km apart) and date/cover helpers
supabase/migrations/       schema, RLS and storage policies
supabase/config.toml       local Supabase stack settings
tests/unit/                Vitest unit tests
tests/db/                  Vitest integration tests against local Supabase
tests/e2e/                 Playwright end-to-end tests
```

## Accessibility notes

- Skip link, semantic headings, labelled landmarks, and visible focus rings throughout
- Place search is an ARIA combobox with arrow-key navigation and live result counts
- Errors use an icon plus text, never colour alone; status changes are announced through toasts and live regions
- The map always has a parallel place list, so pins are reachable without a pointer
- `prefers-reduced-motion` disables animations and map fly-to transitions
