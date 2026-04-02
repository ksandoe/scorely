-- ============================
-- SEED DATA FOR SCORELY
-- ============================

-- ----------------------------
-- PROFILES
-- ----------------------------
insert into public.profiles (id, username)
values
  ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', 'alex'),
  ('0c7c0435-1674-4112-9d67-1e01617ebd8d', 'jamie'),
  ('6c45e05b-7770-45e9-afe8-c6effad70f88', 'taylor'),
  ('b3ec3a1c-5bf7-4b67-b835-6107195cf971', 'morgan')
on conflict (id) do nothing;

-- ----------------------------
-- SONGS
-- ----------------------------
insert into public.songs (song_id, title, artist, album_art, genre, release_year)
values
  (gen_random_uuid(), 'Blinding Lights', 'The Weeknd', null, 'Pop', 2020),
  (gen_random_uuid(), 'Levitating', 'Dua Lipa', null, 'Pop', 2020),
  (gen_random_uuid(), 'Lose Yourself', 'Eminem', null, 'Hip-Hop', 2002),
  (gen_random_uuid(), 'Bohemian Rhapsody', 'Queen', null, 'Rock', 1975),
  (gen_random_uuid(), 'Bad Guy', 'Billie Eilish', null, 'Alt Pop', 2019),
  (gen_random_uuid(), 'As It Was', 'Harry Styles', null, 'Pop', 2022);

-- ----------------------------
-- RATINGS
-- ----------------------------
-- Use subqueries to grab song_ids so we don’t hardcode UUIDs

insert into public.ratings (user_id, song_id, rating_value, review)
values
  (
    '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
    (select song_id from public.songs where title = 'Blinding Lights' limit 1),
    5,
    'Absolute banger. Never gets old.'
  ),
  (
    '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
    (select song_id from public.songs where title = 'Lose Yourself' limit 1),
    4,
    'Classic workout track.'
  ),
  (
    '0c7c0435-1674-4112-9d67-1e01617ebd8d',
    (select song_id from public.songs where title = 'Levitating' limit 1),
    5,
    'Super fun and catchy.'
  ),
  (
    '6c45e05b-7770-45e9-afe8-c6effad70f88',
    (select song_id from public.songs where title = 'Bohemian Rhapsody' limit 1),
    5,
    'A masterpiece.'
  ),
  (
    'b3ec3a1c-5bf7-4b67-b835-6107195cf971',
    (select song_id from public.songs where title = 'Bad Guy' limit 1),
    3,
    'Interesting vibe, not my favorite.'
  )
on conflict (user_id, song_id) do nothing;

-- ----------------------------
-- BOOKMARKS
-- ----------------------------
insert into public.bookmarks (user_id, song_id)
values
  (
    '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
    (select song_id from public.songs where title = 'As It Was' limit 1)
  ),
  (
    '0c7c0435-1674-4112-9d67-1e01617ebd8d',
    (select song_id from public.songs where title = 'Blinding Lights' limit 1)
  ),
  (
    '6c45e05b-7770-45e9-afe8-c6effad70f88',
    (select song_id from public.songs where title = 'Levitating' limit 1)
  )
on conflict (user_id, song_id) do nothing;

-- ----------------------------
-- FRIENDS
-- ----------------------------
insert into public.friends (user_id, friend_user_id)
values
  ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', '0c7c0435-1674-4112-9d67-1e01617ebd8d'),
  ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', '6c45e05b-7770-45e9-afe8-c6effad70f88'),
  ('0c7c0435-1674-4112-9d67-1e01617ebd8d', 'b3ec3a1c-5bf7-4b67-b835-6107195cf971')
on conflict (user_id, friend_user_id) do nothing;

-- ----------------------------
-- SEARCH HISTORY
-- ----------------------------
insert into public.search (user_id, query)
values
  ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', 'The Weeknd'),
  ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', 'pop hits'),
  ('0c7c0435-1674-4112-9d67-1e01617ebd8d', 'Dua Lipa'),
  ('6c45e05b-7770-45e9-afe8-c6effad70f88', 'classic rock'),
  ('b3ec3a1c-5bf7-4b67-b835-6107195cf971', 'Billie Eilish');