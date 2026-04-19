-- -------------
-- TOP 5 SONGS (manually curated)
-- -------------

create table if not exists public.top5_songs (
  top5_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid not null references public.songs(song_id) on delete cascade,
  position integer not null,
  created_at timestamptz not null default now(),
  constraint top5_position_check check (position between 1 and 5),
  constraint top5_user_position_unique unique (user_id, position),
  constraint top5_user_song_unique unique (user_id, song_id)
);

alter table public.top5_songs enable row level security;

-- Public visibility: anyone can view any user's Top 5.
create policy "Top5: public can read"
on public.top5_songs
for select
to anon, authenticated
using (true);

create policy "Top5: users can insert their own"
on public.top5_songs
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Top5: users can update their own"
on public.top5_songs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Top5: users can delete their own"
on public.top5_songs
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists top5_user_id_idx on public.top5_songs (user_id);
create index if not exists top5_song_id_idx on public.top5_songs (song_id);
