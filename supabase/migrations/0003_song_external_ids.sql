-- -------------
-- SONG EXTERNAL IDS (for imports from external catalogs)
-- -------------

alter table public.songs
  add column if not exists external_source text,
  add column if not exists external_id text;

create unique index if not exists songs_external_source_id_unique
on public.songs (external_source, external_id)
where external_source is not null and external_id is not null;
