-- Ready-to-run SQL test pack for Scorely
-- Based on the uploaded PRD and initial Supabase/Postgres schema.
-- Run in Supabase SQL Editor as an admin/service role for easiest testing,
-- since RLS is enabled on all tables.

-- =========================================================
-- OPTIONAL: START WITH CLEAN TEST DATA
-- =========================================================

-- Delete child rows first to respect foreign keys
DELETE FROM public.search
WHERE user_id IN (
  '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
  '0c7c0435-1674-4112-9d67-1e01617ebd8d',
  '6c45e05b-7770-45e9-afe8-c6effad70f88',
  'b3ec3a1c-5bf7-4b67-b835-6107195cf971'
);

DELETE FROM public.friends
WHERE user_id IN (
  '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
  '0c7c0435-1674-4112-9d67-1e01617ebd8d',
  '6c45e05b-7770-45e9-afe8-c6effad70f88',
  'b3ec3a1c-5bf7-4b67-b835-6107195cf971'
)
OR friend_user_id IN (
  '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
  '0c7c0435-1674-4112-9d67-1e01617ebd8d',
  '6c45e05b-7770-45e9-afe8-c6effad70f88',
  'b3ec3a1c-5bf7-4b67-b835-6107195cf971'
);

DELETE FROM public.bookmarks
WHERE user_id IN (
  '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
  '0c7c0435-1674-4112-9d67-1e01617ebd8d',
  '6c45e05b-7770-45e9-afe8-c6effad70f88',
  'b3ec3a1c-5bf7-4b67-b835-6107195cf971'
);

DELETE FROM public.ratings
WHERE user_id IN (
  '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
  '0c7c0435-1674-4112-9d67-1e01617ebd8d',
  '6c45e05b-7770-45e9-afe8-c6effad70f88',
  'b3ec3a1c-5bf7-4b67-b835-6107195cf971'
);

DELETE FROM public.songs
WHERE title IN ('Nights', 'Dreams', 'Redbone', 'Motion Pictures');

-- Keep profiles because they map to existing auth.users IDs.

-- =========================================================
-- 1) PROFILES CRUD
-- =========================================================

-- CREATE / UPSERT
INSERT INTO public.profiles (id, username)
VALUES
  ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', 'alex'),
  ('0c7c0435-1674-4112-9d67-1e01617ebd8d', 'jamie'),
  ('6c45e05b-7770-45e9-afe8-c6effad70f88', 'taylor'),
  ('b3ec3a1c-5bf7-4b67-b835-6107195cf971', 'morgan')
ON CONFLICT (id) DO UPDATE
SET username = EXCLUDED.username;

-- READ
SELECT *
FROM public.profiles
ORDER BY created_at DESC;

SELECT *
FROM public.profiles
WHERE id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8';

-- UPDATE
UPDATE public.profiles
SET username = 'alex_updated'
WHERE id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
RETURNING *;

-- restore original username for later joins/readability
UPDATE public.profiles
SET username = 'alex'
WHERE id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
RETURNING *;

-- =========================================================
-- 2) SONGS CRUD
-- =========================================================

-- CREATE
INSERT INTO public.songs (title, artist, album_art, genre, release_year)
VALUES
  ('Nights', 'Frank Ocean', NULL, 'R&B', 2016),
  ('Dreams', 'Fleetwood Mac', NULL, 'Rock', 1977),
  ('Redbone', 'Childish Gambino', NULL, 'Funk', 2016),
  ('Motion Pictures', 'Neil Frances', NULL, 'Indie', 2021)
RETURNING *;

-- READ
SELECT *
FROM public.songs
ORDER BY created_at DESC;

SELECT *
FROM public.songs
WHERE genre = 'Rock'
ORDER BY release_year ASC;

SELECT *
FROM public.songs
WHERE title ILIKE '%night%';

-- UPDATE
UPDATE public.songs
SET genre = 'Alternative R&B',
    album_art = 'https://example.com/nights.jpg'
WHERE title = 'Nights'
  AND artist = 'Frank Ocean'
RETURNING *;

-- =========================================================
-- 3) RATINGS CRUD
-- =========================================================

-- CREATE
INSERT INTO public.ratings (user_id, song_id, rating_value, review)
VALUES
  (
    '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
    (SELECT song_id FROM public.songs WHERE title = 'Nights' AND artist = 'Frank Ocean' LIMIT 1),
    5,
    'Amazing production and mood.'
  ),
  (
    '6c45e05b-7770-45e9-afe8-c6effad70f88',
    (SELECT song_id FROM public.songs WHERE title = 'Nights' AND artist = 'Frank Ocean' LIMIT 1),
    4,
    'Really strong track.'
  ),
  (
    '0c7c0435-1674-4112-9d67-1e01617ebd8d',
    (SELECT song_id FROM public.songs WHERE title = 'Dreams' AND artist = 'Fleetwood Mac' LIMIT 1),
    5,
    'Timeless.'
  )
RETURNING *;

-- READ
SELECT *
FROM public.ratings
ORDER BY created_at DESC;

SELECT r.rating_id, r.rating_value, r.review, p.username, s.title, s.artist
FROM public.ratings r
JOIN public.profiles p ON p.id = r.user_id
JOIN public.songs s ON s.song_id = r.song_id
ORDER BY r.created_at DESC;

SELECT r.*
FROM public.ratings r
WHERE r.user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8';

-- UPDATE
UPDATE public.ratings
SET rating_value = 4,
    review = 'Still great, but not quite a 5 today.'
WHERE user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
  AND song_id = (
    SELECT song_id
    FROM public.songs
    WHERE title = 'Nights' AND artist = 'Frank Ocean'
    LIMIT 1
  )
RETURNING *;

-- =========================================================
-- 4) BOOKMARKS CRUD
-- =========================================================

-- CREATE
INSERT INTO public.bookmarks (user_id, song_id)
VALUES
  (
    '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
    (SELECT song_id FROM public.songs WHERE title = 'Dreams' AND artist = 'Fleetwood Mac' LIMIT 1)
  ),
  (
    'b3ec3a1c-5bf7-4b67-b835-6107195cf971',
    (SELECT song_id FROM public.songs WHERE title = 'Nights' AND artist = 'Frank Ocean' LIMIT 1)
  )
RETURNING *;

-- READ
SELECT *
FROM public.bookmarks
ORDER BY created_at DESC;

SELECT b.bookmark_id, p.username, s.title, s.artist, b.created_at
FROM public.bookmarks b
JOIN public.profiles p ON p.id = b.user_id
JOIN public.songs s ON s.song_id = b.song_id
ORDER BY b.created_at DESC;

-- UPDATE (switch bookmarked song)
UPDATE public.bookmarks
SET song_id = (
  SELECT song_id
  FROM public.songs
  WHERE title = 'Redbone' AND artist = 'Childish Gambino'
  LIMIT 1
)
WHERE user_id = 'b3ec3a1c-5bf7-4b67-b835-6107195cf971'
  AND song_id = (
    SELECT song_id
    FROM public.songs
    WHERE title = 'Nights' AND artist = 'Frank Ocean'
    LIMIT 1
  )
RETURNING *;

-- =========================================================
-- 5) FRIENDS CRUD
-- =========================================================

-- CREATE
INSERT INTO public.friends (user_id, friend_user_id)
VALUES
  ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', '0c7c0435-1674-4112-9d67-1e01617ebd8d'),
  ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', '6c45e05b-7770-45e9-afe8-c6effad70f88')
RETURNING *;

-- READ
SELECT *
FROM public.friends
ORDER BY created_at DESC;

SELECT f.friend_id, p1.username AS user_name, p2.username AS friend_name, f.created_at
FROM public.friends f
JOIN public.profiles p1 ON p1.id = f.user_id
JOIN public.profiles p2 ON p2.id = f.friend_user_id
ORDER BY f.created_at DESC;

SELECT *
FROM public.friends
WHERE user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
   OR friend_user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8';

-- UPDATE
UPDATE public.friends
SET friend_user_id = 'b3ec3a1c-5bf7-4b67-b835-6107195cf971'
WHERE user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
  AND friend_user_id = '6c45e05b-7770-45e9-afe8-c6effad70f88'
RETURNING *;

-- =========================================================
-- 6) SEARCH CRUD
-- =========================================================

-- CREATE
INSERT INTO public.search (user_id, query)
VALUES
  ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', 'Frank Ocean'),
  ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', 'best R&B songs'),
  ('6c45e05b-7770-45e9-afe8-c6effad70f88', 'classic rock')
RETURNING *;

-- READ
SELECT *
FROM public.search
ORDER BY searched_at DESC;

SELECT *
FROM public.search
WHERE user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
ORDER BY searched_at DESC;

-- UPDATE
UPDATE public.search
SET query = 'Frank Ocean Nights'
WHERE user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
  AND query = 'Frank Ocean'
RETURNING *;

-- =========================================================
-- 7) JOINED APP-STYLE READ QUERIES
-- =========================================================

-- Show all ratings with usernames and song metadata
SELECT
  r.rating_id,
  p.username,
  s.title,
  s.artist,
  r.rating_value,
  r.review,
  r.created_at
FROM public.ratings r
JOIN public.profiles p ON p.id = r.user_id
JOIN public.songs s ON s.song_id = r.song_id
ORDER BY r.created_at DESC;

-- Show one user's bookmarked songs
SELECT
  p.username,
  s.title,
  s.artist,
  s.genre,
  b.created_at AS bookmarked_at
FROM public.bookmarks b
JOIN public.profiles p ON p.id = b.user_id
JOIN public.songs s ON s.song_id = b.song_id
WHERE b.user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
ORDER BY b.created_at DESC;

-- Show a user's friends
SELECT
  p.username AS user_name,
  pf.username AS friend_name,
  f.created_at
FROM public.friends f
JOIN public.profiles p ON p.id = f.user_id
JOIN public.profiles pf ON pf.id = f.friend_user_id
WHERE f.user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8';

-- Show ratings from a user's friends
SELECT
  owner.username AS viewing_user,
  friend.username AS friend_username,
  s.title,
  s.artist,
  r.rating_value,
  r.review,
  r.created_at
FROM public.friends f
JOIN public.profiles owner ON owner.id = f.user_id
JOIN public.profiles friend ON friend.id = f.friend_user_id
JOIN public.ratings r ON r.user_id = friend.id
JOIN public.songs s ON s.song_id = r.song_id
WHERE f.user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
ORDER BY r.created_at DESC;

-- =========================================================
-- 8) NEGATIVE / CONSTRAINT TESTS
-- Run these one at a time if you want to observe failures.
-- =========================================================

-- Should fail: rating_value must be between 1 and 5
-- INSERT INTO public.ratings (user_id, song_id, rating_value, review)
-- VALUES (
--   '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
--   (SELECT song_id FROM public.songs WHERE title = 'Nights' AND artist = 'Frank Ocean' LIMIT 1),
--   6,
--   'Invalid rating'
-- );

-- Should fail: duplicate rating for same user/song
-- INSERT INTO public.ratings (user_id, song_id, rating_value, review)
-- VALUES (
--   '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
--   (SELECT song_id FROM public.songs WHERE title = 'Nights' AND artist = 'Frank Ocean' LIMIT 1),
--   5,
--   'Duplicate test'
-- );

-- Should fail: users cannot friend themselves
-- INSERT INTO public.friends (user_id, friend_user_id)
-- VALUES ('4e9ef90b-7ec4-48c0-9693-80463adb09d8', '4e9ef90b-7ec4-48c0-9693-80463adb09d8');

-- Should fail: duplicate bookmark for same user/song
-- INSERT INTO public.bookmarks (user_id, song_id)
-- VALUES (
--   '4e9ef90b-7ec4-48c0-9693-80463adb09d8',
--   (SELECT song_id FROM public.songs WHERE title = 'Dreams' AND artist = 'Fleetwood Mac' LIMIT 1)
-- );

-- =========================================================
-- 9) DELETE TESTS
-- Run after the CRUD reads above.
-- =========================================================

-- DELETE from search
DELETE FROM public.search
WHERE user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
  AND query = 'best R&B songs'
RETURNING *;

-- DELETE from friends
DELETE FROM public.friends
WHERE user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
  AND friend_user_id = '0c7c0435-1674-4112-9d67-1e01617ebd8d'
RETURNING *;

-- DELETE from bookmarks
DELETE FROM public.bookmarks
WHERE user_id = '4e9ef90b-7ec4-48c0-9693-80463adb09d8'
  AND song_id = (
    SELECT song_id
    FROM public.songs
    WHERE title = 'Dreams' AND artist = 'Fleetwood Mac'
    LIMIT 1
  )
RETURNING *;

-- DELETE from ratings
DELETE FROM public.ratings
WHERE user_id = '6c45e05b-7770-45e9-afe8-c6effad70f88'
  AND song_id = (
    SELECT song_id
    FROM public.songs
    WHERE title = 'Nights' AND artist = 'Frank Ocean'
    LIMIT 1
  )
RETURNING *;

-- DELETE from songs
DELETE FROM public.songs
WHERE title = 'Motion Pictures'
  AND artist = 'Neil Frances'
RETURNING *;

-- =========================================================
-- END
-- =========================================================