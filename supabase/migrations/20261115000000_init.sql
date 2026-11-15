-- Waymark schema: profiles, trips, memories, photo storage, and Row Level Security.
-- Every row belongs to one user, and RLS lets each person see and change only their own.

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  approximate_location boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  start_date date,
  end_date date,
  cover_photo_path text,
  created_at timestamptz not null default now(),
  constraint trips_dates_ordered check (start_date is null or end_date is null or end_date >= start_date)
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  place_name text not null check (char_length(place_name) between 1 and 120),
  address text check (char_length(address) <= 240),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  visited_on date not null default current_date,
  note text check (char_length(note) <= 2000),
  photo_path text,
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memories_coordinates_paired check ((latitude is null) = (longitude is null))
);

-- ---------------------------------------------------------------- indexes

create index trips_user_start_idx on public.trips (user_id, start_date desc);
create index memories_user_visited_idx on public.memories (user_id, visited_on desc);
create index memories_trip_idx on public.memories (trip_id) where trip_id is not null;
create index memories_user_place_idx on public.memories (user_id, lower(place_name));
create index memories_tags_idx on public.memories using gin (tags);

-- ---------------------------------------------------------------- triggers

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger memories_touch before update on public.memories
for each row execute function public.touch_updated_at();

-- Create a profile row whenever someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(new.raw_user_meta_data ->> 'display_name', 60), ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- row level security

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.memories enable row level security;

create policy "Profiles: owner can read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Profiles: owner can insert" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "Profiles: owner can update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Trips: owner can read" on public.trips
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Trips: owner can insert" on public.trips
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Trips: owner can update" on public.trips
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Trips: owner can delete" on public.trips
  for delete to authenticated using (user_id = (select auth.uid()));

-- A memory may only point at a trip owned by the same person.
create policy "Memories: owner can read" on public.memories
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Memories: owner can insert" on public.memories
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and (trip_id is null or exists (select 1 from public.trips t where t.id = trip_id and t.user_id = (select auth.uid())))
  );
create policy "Memories: owner can update" on public.memories
  for update to authenticated using (user_id = (select auth.uid())) with check (
    user_id = (select auth.uid())
    and (trip_id is null or exists (select 1 from public.trips t where t.id = trip_id and t.user_id = (select auth.uid())))
  );
create policy "Memories: owner can delete" on public.memories
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- photo storage

-- Private bucket. Files live at "<user id>/<file>", and only that user can touch them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-photos', 'memory-photos', false, 15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif']
)
on conflict (id) do nothing;

create policy "Photos: owner can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Photos: owner can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Photos: owner can update" on storage.objects
  for update to authenticated
  using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Photos: owner can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------- account deletion

-- Lets a signed-in person delete their own auth user. Their profile, trips and
-- memories cascade. The app removes their photo files through the Storage API first.
create function public.delete_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
