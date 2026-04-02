-- Enable UUID generation helpers (safe if already enabled)
create extension if not exists pgcrypto;

-- -------------
-- PROFILES
-- -------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles: users can view own row"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
);

create policy "Profiles: users can insert own row"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
);

create policy "Profiles: users can update own row"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
)
with check (
  (select auth.uid()) = id
);

create policy "Profiles: users can delete own row"
on public.profiles
for delete
to authenticated
using (
  (select auth.uid()) = id
);

-- Optional but recommended uniqueness (prevents duplicate usernames)
create unique index if not exists profiles_username_unique
on public.profiles (username);

-- -------------
-- SONGS (global catalog)
-- -------------

create table if not exists public.songs (
  song_id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  album_art text,
  genre text,
  release_year integer,
  created_at timestamptz not null default now()
);

alter table public.songs enable row level security;

-- You didn't specify who can read/write songs.
-- Common default for a public catalog is "anyone can read, only owners/admin can write".
-- If you want songs to be writable by authenticated users, tell me and I’ll adjust policies.
create policy "Songs: public can read"
on public.songs
for select
to anon, authenticated
using (true);

-- -------------
-- RATINGS (unique per user+song, 1..5)
-- -------------

create table if not exists public.ratings (
  rating_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid not null references public.songs(song_id) on delete cascade,
  rating_value integer not null,
  review text,
  created_at timestamptz not null default now(),
  constraint ratings_rating_value_check check (rating_value between 1 and 5),
  constraint ratings_user_song_unique unique (user_id, song_id)
);

alter table public.ratings enable row level security;

create policy "Ratings: users can read own rows"
on public.ratings
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "Ratings: users can insert own rows"
on public.ratings
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "Ratings: users can update own rows"
on public.ratings
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

create policy "Ratings: users can delete own rows"
on public.ratings
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);

-- Indexes for RLS performance
create index if not exists ratings_user_id_idx on public.ratings (user_id);
create index if not exists ratings_song_id_idx on public.ratings (song_id);

-- -------------
-- BOOKMARKS (unique per user+song)
-- -------------

create table if not exists public.bookmarks (
  bookmark_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid not null references public.songs(song_id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint bookmarks_user_song_unique unique (user_id, song_id)
);

alter table public.bookmarks enable row level security;

create policy "Bookmarks: users can read own rows"
on public.bookmarks
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "Bookmarks: users can insert own rows"
on public.bookmarks
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "Bookmarks: users can delete own rows"
on public.bookmarks
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);

-- Indexes for RLS performance
create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id);
create index if not exists bookmarks_song_id_idx on public.bookmarks (song_id);

-- -------------
-- FRIENDS (user<->friend_user)
-- -------------

create table if not exists public.friends (
  friend_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friends_user_friend_unique unique (user_id, friend_user_id),
  constraint friends_no_self check (user_id <> friend_user_id)
);

alter table public.friends enable row level security;

-- Users can see their own friendships (both directions depending on your app logic).
-- Here: allow select where the user participates.
create policy "Friends: users can read friendships they participate in"
on public.friends
for select
to authenticated
using (
  (select auth.uid()) in (user_id, friend_user_id)
);

create policy "Friends: users can create friendship rows for themselves"
on public.friends
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "Friends: users can delete friendships they created"
on public.friends
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);

-- Indexes for RLS performance
create index if not exists friends_user_id_idx on public.friends (user_id);
create index if not exists friends_friend_user_id_idx on public.friends (friend_user_id);

-- -------------
-- SEARCH (history; no uniqueness)
-- -------------

create table if not exists public.search (
  search_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query text not null,
  searched_at timestamptz not null default now()
);

alter table public.search enable row level security;

create policy "Search: users can read own history"
on public.search
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "Search: users can insert own search rows"
on public.search
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

-- Indexes for RLS performance
create index if not exists search_user_id_idx on public.search (user_id);
create index if not exists search_searched_at_idx on public.search (searched_at);