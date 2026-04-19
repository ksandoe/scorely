create table if not exists public.listens (
  listen_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid not null references public.songs(song_id) on delete cascade,
  listened_at timestamptz not null default now()
);

alter table public.listens enable row level security;

create policy "Listens: users can read own rows"
on public.listens
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Listens: users can insert own rows"
on public.listens
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Listens: users can delete own rows"
on public.listens
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists listens_user_id_idx on public.listens (user_id);
create index if not exists listens_song_id_idx on public.listens (song_id);
create index if not exists listens_listened_at_idx on public.listens (listened_at desc);
