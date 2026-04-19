alter table public.profiles enable row level security;

create policy "Profiles: public can read"
on public.profiles
for select
to anon, authenticated
using (true);

alter table public.ratings enable row level security;

create policy "Ratings: public can read"
on public.ratings
for select
to anon, authenticated
using (true);
