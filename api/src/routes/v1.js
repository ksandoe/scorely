import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  parsePagination,
  sendError,
  toBookmark,
  toFriend,
  toProfile,
  toRating,
  toSearchEntry,
  toSong
} from '../lib/http.js'
import { getSupabaseAdmin, getSupabaseAnon, getSupabaseForJwt } from '../lib/supabase.js'

export const v1Router = express.Router()

v1Router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

v1Router.post('/auth/otp/start', async (req, res) => {
  const { email } = req.body ?? {}
  if (!email || typeof email !== 'string') {
    return sendError(res, 400, 'validation_error', 'email is required')
  }

  const supabase = getSupabaseAnon()
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) {
    return sendError(res, 400, 'auth_error', error.message)
  }

  return res.json({ message: 'OTP sent if the email is eligible.' })
})

v1Router.post('/auth/otp/verify', async (req, res) => {
  const { email, token } = req.body ?? {}
  if (!email || typeof email !== 'string') {
    return sendError(res, 400, 'validation_error', 'email is required')
  }
  if (!token || typeof token !== 'string') {
    return sendError(res, 400, 'validation_error', 'token is required')
  }

  const supabaseAnon = getSupabaseAnon()
  const { data, error } = await supabaseAnon.auth.verifyOtp({
    email,
    token,
    type: 'email'
  })

  if (error || !data?.session || !data?.user) {
    return sendError(res, 401, 'auth_error', error?.message || 'Authentication failed')
  }

  const userId = data.user.id

  const supabaseAdmin = getSupabaseAdmin()

  const usernameBase = email.split('@')[0] || 'user'
  const username = usernameBase.slice(0, 50)

  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (!profileRow) {
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: userId, username })

    if (insertError) {
      return sendError(res, 400, 'validation_error', insertError.message)
    }
  }

  const { data: profileAfter, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) {
    return sendError(res, 400, 'unknown_error', profileError.message)
  }

  return res.json({
    accessToken: data.session.access_token,
    tokenType: 'Bearer',
    expiresIn: data.session.expires_in,
    refreshToken: data.session.refresh_token ?? null,
    user: toProfile(profileAfter)
  })
})

// Profiles
v1Router.get('/profiles/me', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.auth.userId)
    .maybeSingle()

  if (error) return sendError(res, 400, 'unknown_error', error.message)
  if (!data) return sendError(res, 404, 'not_found', 'Profile not found')

  return res.json(toProfile(data))
})

v1Router.patch('/profiles/me', requireAuth, async (req, res) => {
  const { username } = req.body ?? {}
  if (!username || typeof username !== 'string' || username.length < 3 || username.length > 50) {
    return sendError(res, 400, 'validation_error', 'username must be 3-50 characters')
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', req.auth.userId)
    .select('*')
    .maybeSingle()

  if (error) return sendError(res, 400, 'validation_error', error.message)
  if (!data) return sendError(res, 404, 'not_found', 'Profile not found')

  return res.json(toProfile(data))
})

v1Router.delete('/profiles/me', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('profiles').delete().eq('id', req.auth.userId)
  if (error) return sendError(res, 400, 'unknown_error', error.message)
  return res.status(204).send()
})

v1Router.get('/profiles/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) return sendError(res, 400, 'unknown_error', error.message)
  if (!data) return sendError(res, 404, 'not_found', 'Profile not found')
  return res.json(toProfile(data))
})

// Songs
v1Router.get('/songs', async (req, res) => {
  const { page, pageSize, from, to } = parsePagination(req.query)

  const supabase = getSupabaseAnon()

  let q = supabase.from('songs').select('*', { count: 'exact' })

  if (req.query.q) {
    const term = String(req.query.q)
    q = q.or(`title.ilike.%${term}%,artist.ilike.%${term}%`)
  }
  if (req.query.genre) q = q.eq('genre', String(req.query.genre))
  if (req.query.artist) q = q.eq('artist', String(req.query.artist))
  if (req.query.releaseYear) q = q.eq('release_year', Number(req.query.releaseYear))

  const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to)

  if (error) return sendError(res, 400, 'unknown_error', error.message)

  return res.json({
    data: (data ?? []).map(toSong),
    meta: { page, pageSize, total: count ?? 0 }
  })
})

v1Router.post('/songs', requireAuth, async (req, res) => {
  const { title, artist, albumArt, genre, releaseYear } = req.body ?? {}
  if (!title || typeof title !== 'string') return sendError(res, 400, 'validation_error', 'title is required')
  if (!artist || typeof artist !== 'string')
    return sendError(res, 400, 'validation_error', 'artist is required')

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('songs')
    .insert({
      title,
      artist,
      album_art: albumArt ?? null,
      genre: genre ?? null,
      release_year: releaseYear ?? null
    })
    .select('*')
    .single()

  if (error) return sendError(res, 400, 'validation_error', error.message)

  return res.status(201).json(toSong(data))
})

v1Router.get('/songs/:songId', async (req, res) => {
  const supabase = getSupabaseAnon()
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('song_id', req.params.songId)
    .maybeSingle()

  if (error) return sendError(res, 400, 'unknown_error', error.message)
  if (!data) return sendError(res, 404, 'not_found', 'Song not found')

  return res.json(toSong(data))
})

v1Router.patch('/songs/:songId', requireAuth, async (req, res) => {
  const payload = req.body ?? {}
  const updates = {}

  if ('title' in payload) updates.title = payload.title
  if ('artist' in payload) updates.artist = payload.artist
  if ('albumArt' in payload) updates.album_art = payload.albumArt
  if ('genre' in payload) updates.genre = payload.genre
  if ('releaseYear' in payload) updates.release_year = payload.releaseYear

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, 'validation_error', 'At least one field is required')
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('songs')
    .update(updates)
    .eq('song_id', req.params.songId)
    .select('*')
    .maybeSingle()

  if (error) return sendError(res, 400, 'validation_error', error.message)
  if (!data) return sendError(res, 404, 'not_found', 'Song not found')

  return res.json(toSong(data))
})

v1Router.delete('/songs/:songId', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('songs')
    .delete()
    .eq('song_id', req.params.songId)
    .select('song_id')
    .maybeSingle()

  if (error) return sendError(res, 400, 'unknown_error', error.message)
  if (!data) return sendError(res, 404, 'not_found', 'Song not found')

  return res.status(204).send()
})

// Ratings
v1Router.get('/ratings', requireAuth, async (req, res) => {
  const { page, pageSize, from, to } = parsePagination(req.query)

  const supabase = getSupabaseAdmin()

  let userIdFilter = req.auth.userId

  if (req.query.userId) {
    userIdFilter = String(req.query.userId)
  }

  // friendOnly: ratings authored by caller's friends
  if (String(req.query.friendOnly).toLowerCase() === 'true') {
    const { data: friends, error: friendsError } = await supabase
      .from('friends')
      .select('friend_user_id')
      .eq('user_id', req.auth.userId)

    if (friendsError) return sendError(res, 400, 'unknown_error', friendsError.message)

    const friendIds = (friends ?? []).map((f) => f.friend_user_id)
    if (friendIds.length === 0) {
      return res.json({ data: [], meta: { page, pageSize, total: 0 } })
    }

    let q = supabase
      .from('ratings')
      .select('*, song:songs(*), profile:profiles(*)', { count: 'exact' })
      .in('user_id', friendIds)

    if (req.query.songId) q = q.eq('song_id', String(req.query.songId))

    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to)
    if (error) return sendError(res, 400, 'unknown_error', error.message)

    return res.json({
      data: (data ?? []).map(toRating),
      meta: { page, pageSize, total: count ?? 0 }
    })
  }

  let q = supabase
    .from('ratings')
    .select('*, song:songs(*), profile:profiles(*)', { count: 'exact' })
    .eq('user_id', userIdFilter)

  if (req.query.songId) q = q.eq('song_id', String(req.query.songId))

  const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to)

  if (error) return sendError(res, 400, 'unknown_error', error.message)

  return res.json({
    data: (data ?? []).map(toRating),
    meta: { page, pageSize, total: count ?? 0 }
  })
})

v1Router.post('/ratings', requireAuth, async (req, res) => {
  const { songId, ratingValue, review } = req.body ?? {}
  if (!songId || typeof songId !== 'string') return sendError(res, 400, 'validation_error', 'songId is required')
  const ratingNum = Number(ratingValue)
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return sendError(res, 400, 'validation_error', 'ratingValue must be an integer between 1 and 5')
  }
  if (review != null && typeof review !== 'string') {
    return sendError(res, 400, 'validation_error', 'review must be a string')
  }

  const supabase = getSupabaseAdmin()

  const { data: songRow } = await supabase
    .from('songs')
    .select('song_id')
    .eq('song_id', songId)
    .maybeSingle()
  if (!songRow) return sendError(res, 404, 'not_found', 'Song not found')

  const { data, error } = await supabase
    .from('ratings')
    .insert({
      user_id: req.auth.userId,
      song_id: songId,
      rating_value: ratingNum,
      review: review ?? null
    })
    .select('*, song:songs(*), profile:profiles(*)')
    .single()

  if (error) return sendError(res, 400, 'validation_error', error.message)

  return res.status(201).json(toRating(data))
})

v1Router.get('/ratings/:ratingId', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('ratings')
    .select('*, song:songs(*), profile:profiles(*)')
    .eq('rating_id', req.params.ratingId)
    .maybeSingle()

  if (error) return sendError(res, 400, 'unknown_error', error.message)
  if (!data) return sendError(res, 404, 'not_found', 'Rating not found')
  if (data.user_id !== req.auth.userId) return sendError(res, 403, 'forbidden', 'Caller does not own the rating')

  return res.json(toRating(data))
})

v1Router.patch('/ratings/:ratingId', requireAuth, async (req, res) => {
  const payload = req.body ?? {}
  const updates = {}

  if ('ratingValue' in payload) {
    const ratingNum = Number(payload.ratingValue)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return sendError(res, 400, 'validation_error', 'ratingValue must be an integer between 1 and 5')
    }
    updates.rating_value = ratingNum
  }
  if ('review' in payload) {
    if (payload.review != null && typeof payload.review !== 'string') {
      return sendError(res, 400, 'validation_error', 'review must be a string')
    }
    updates.review = payload.review
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, 'validation_error', 'At least one field is required')
  }

  const supabase = getSupabaseAdmin()
  const { data: existing, error: existingError } = await supabase
    .from('ratings')
    .select('rating_id,user_id')
    .eq('rating_id', req.params.ratingId)
    .maybeSingle()

  if (existingError) return sendError(res, 400, 'unknown_error', existingError.message)
  if (!existing) return sendError(res, 404, 'not_found', 'Rating not found')
  if (existing.user_id !== req.auth.userId) {
    return sendError(res, 403, 'forbidden', 'Caller does not own the rating')
  }

  const { data, error } = await supabase
    .from('ratings')
    .update(updates)
    .eq('rating_id', req.params.ratingId)
    .select('*, song:songs(*), profile:profiles(*)')
    .single()

  if (error) return sendError(res, 400, 'validation_error', error.message)

  return res.json(toRating(data))
})

v1Router.delete('/ratings/:ratingId', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()
  const { data: existing, error: existingError } = await supabase
    .from('ratings')
    .select('rating_id,user_id')
    .eq('rating_id', req.params.ratingId)
    .maybeSingle()

  if (existingError) return sendError(res, 400, 'unknown_error', existingError.message)
  if (!existing) return sendError(res, 404, 'not_found', 'Rating not found')
  if (existing.user_id !== req.auth.userId) {
    return sendError(res, 403, 'forbidden', 'Caller does not own the rating')
  }

  const { error } = await supabase.from('ratings').delete().eq('rating_id', req.params.ratingId)
  if (error) return sendError(res, 400, 'unknown_error', error.message)
  return res.status(204).send()
})

// Bookmarks
v1Router.get('/bookmarks', requireAuth, async (req, res) => {
  const { page, pageSize, from, to } = parsePagination(req.query)
  const supabase = getSupabaseAdmin()

  let q = supabase
    .from('bookmarks')
    .select('*, song:songs(*)', { count: 'exact' })
    .eq('user_id', req.auth.userId)

  if (req.query.songId) q = q.eq('song_id', String(req.query.songId))

  const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to)
  if (error) return sendError(res, 400, 'unknown_error', error.message)

  return res.json({
    data: (data ?? []).map(toBookmark),
    meta: { page, pageSize, total: count ?? 0 }
  })
})

v1Router.post('/bookmarks', requireAuth, async (req, res) => {
  const { songId } = req.body ?? {}
  if (!songId || typeof songId !== 'string') return sendError(res, 400, 'validation_error', 'songId is required')

  const supabase = getSupabaseAdmin()

  const { data: songRow } = await supabase
    .from('songs')
    .select('song_id')
    .eq('song_id', songId)
    .maybeSingle()
  if (!songRow) return sendError(res, 404, 'not_found', 'Song not found')

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({ user_id: req.auth.userId, song_id: songId })
    .select('*, song:songs(*)')
    .single()

  if (error) return sendError(res, 400, 'validation_error', error.message)

  return res.status(201).json(toBookmark(data))
})

v1Router.get('/bookmarks/:bookmarkId', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*, song:songs(*)')
    .eq('bookmark_id', req.params.bookmarkId)
    .maybeSingle()

  if (error) return sendError(res, 400, 'unknown_error', error.message)
  if (!data) return sendError(res, 404, 'not_found', 'Bookmark not found')
  if (data.user_id !== req.auth.userId) {
    return sendError(res, 403, 'forbidden', 'Caller does not own the bookmark')
  }

  return res.json(toBookmark(data))
})

v1Router.patch('/bookmarks/:bookmarkId', requireAuth, async (req, res) => {
  const { songId } = req.body ?? {}
  if (!songId || typeof songId !== 'string') return sendError(res, 400, 'validation_error', 'songId is required')

  const supabase = getSupabaseAdmin()

  const { data: existing, error: existingError } = await supabase
    .from('bookmarks')
    .select('bookmark_id,user_id')
    .eq('bookmark_id', req.params.bookmarkId)
    .maybeSingle()

  if (existingError) return sendError(res, 400, 'unknown_error', existingError.message)
  if (!existing) return sendError(res, 404, 'not_found', 'Bookmark not found')
  if (existing.user_id !== req.auth.userId) {
    return sendError(res, 403, 'forbidden', 'Caller does not own the bookmark')
  }

  const { data: songRow } = await supabase
    .from('songs')
    .select('song_id')
    .eq('song_id', songId)
    .maybeSingle()
  if (!songRow) return sendError(res, 404, 'not_found', 'Bookmark or song not found')

  const { data, error } = await supabase
    .from('bookmarks')
    .update({ song_id: songId })
    .eq('bookmark_id', req.params.bookmarkId)
    .select('*, song:songs(*)')
    .single()

  if (error) return sendError(res, 400, 'validation_error', error.message)

  return res.json(toBookmark(data))
})

v1Router.delete('/bookmarks/:bookmarkId', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()

  const { data: existing, error: existingError } = await supabase
    .from('bookmarks')
    .select('bookmark_id,user_id')
    .eq('bookmark_id', req.params.bookmarkId)
    .maybeSingle()

  if (existingError) return sendError(res, 400, 'unknown_error', existingError.message)
  if (!existing) return sendError(res, 404, 'not_found', 'Bookmark not found')
  if (existing.user_id !== req.auth.userId) {
    return sendError(res, 403, 'forbidden', 'Caller does not own the bookmark')
  }

  const { error } = await supabase.from('bookmarks').delete().eq('bookmark_id', req.params.bookmarkId)
  if (error) return sendError(res, 400, 'unknown_error', error.message)
  return res.status(204).send()
})

// Friends
v1Router.get('/friends', requireAuth, async (req, res) => {
  const { page, pageSize, from, to } = parsePagination(req.query)
  const direction = String(req.query.direction ?? 'all')

  const supabase = getSupabaseAdmin()

  let q = supabase
    .from('friends')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (direction === 'outgoing') {
    q = q.eq('user_id', req.auth.userId)
  } else if (direction === 'incoming') {
    q = q.eq('friend_user_id', req.auth.userId)
  } else {
    q = q.or(`user_id.eq.${req.auth.userId},friend_user_id.eq.${req.auth.userId}`)
  }

  const { data, count, error } = await q.range(from, to)
  if (error) return sendError(res, 400, 'unknown_error', error.message)

  return res.json({
    data: (data ?? []).map((row) => toFriend({ ...row })),
    meta: { page, pageSize, total: count ?? 0 }
  })
})

v1Router.post('/friends', requireAuth, async (req, res) => {
  const { friendUserId } = req.body ?? {}
  if (!friendUserId || typeof friendUserId !== 'string') {
    return sendError(res, 400, 'validation_error', 'friendUserId is required')
  }
  if (friendUserId === req.auth.userId) {
    return sendError(res, 400, 'validation_error', 'Cannot friend yourself')
  }

  const supabase = getSupabaseAdmin()

  const { data: friendProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', friendUserId)
    .maybeSingle()

  if (!friendProfile) return sendError(res, 404, 'not_found', 'Friend profile not found')

  const { data, error } = await supabase
    .from('friends')
    .insert({ user_id: req.auth.userId, friend_user_id: friendUserId })
    .select('*')
    .single()

  if (error) return sendError(res, 400, 'validation_error', error.message)

  return res.status(201).json(toFriend({ ...data, friendProfile }))
})

v1Router.get('/friends/:friendId', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .eq('friend_id', req.params.friendId)
    .maybeSingle()

  if (error) return sendError(res, 400, 'unknown_error', error.message)
  if (!data) return sendError(res, 404, 'not_found', 'Friendship not found')

  if (data.user_id !== req.auth.userId && data.friend_user_id !== req.auth.userId) {
    return sendError(res, 404, 'not_found', 'Friendship not found')
  }

  const { data: friendProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.friend_user_id)
    .maybeSingle()

  return res.json(toFriend({ ...data, friendProfile }))
})

v1Router.patch('/friends/:friendId', requireAuth, async (req, res) => {
  const { friendUserId } = req.body ?? {}
  if (!friendUserId || typeof friendUserId !== 'string') {
    return sendError(res, 400, 'validation_error', 'friendUserId is required')
  }
  if (friendUserId === req.auth.userId) {
    return sendError(res, 400, 'validation_error', 'Cannot friend yourself')
  }

  const supabase = getSupabaseAdmin()

  const { data: existing, error: existingError } = await supabase
    .from('friends')
    .select('*')
    .eq('friend_id', req.params.friendId)
    .maybeSingle()

  if (existingError) return sendError(res, 400, 'unknown_error', existingError.message)
  if (!existing) return sendError(res, 404, 'not_found', 'Friendship not found')
  if (existing.user_id !== req.auth.userId) {
    return sendError(res, 403, 'forbidden', 'Caller does not own the friendship row')
  }

  const { data: friendProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', friendUserId)
    .maybeSingle()

  if (!friendProfile) return sendError(res, 404, 'not_found', 'Friendship or friend profile not found')

  const { data, error } = await supabase
    .from('friends')
    .update({ friend_user_id: friendUserId })
    .eq('friend_id', req.params.friendId)
    .select('*')
    .single()

  if (error) return sendError(res, 400, 'validation_error', error.message)

  return res.json(toFriend({ ...data, friendProfile }))
})

v1Router.delete('/friends/:friendId', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()

  const { data: existing, error: existingError } = await supabase
    .from('friends')
    .select('friend_id,user_id')
    .eq('friend_id', req.params.friendId)
    .maybeSingle()

  if (existingError) return sendError(res, 400, 'unknown_error', existingError.message)
  if (!existing) return sendError(res, 404, 'not_found', 'Friendship not found')
  if (existing.user_id !== req.auth.userId) {
    return sendError(res, 403, 'forbidden', 'Caller does not own the friendship row')
  }

  const { error } = await supabase.from('friends').delete().eq('friend_id', req.params.friendId)
  if (error) return sendError(res, 400, 'unknown_error', error.message)
  return res.status(204).send()
})

// Search
v1Router.get('/search', requireAuth, async (req, res) => {
  const { page, pageSize, from, to } = parsePagination(req.query)
  const supabase = getSupabaseAdmin()

  let q = supabase
    .from('search')
    .select('*', { count: 'exact' })
    .eq('user_id', req.auth.userId)

  if (req.query.q) {
    q = q.ilike('query', `%${String(req.query.q)}%`)
  }

  const { data, count, error } = await q.order('searched_at', { ascending: false }).range(from, to)
  if (error) return sendError(res, 400, 'unknown_error', error.message)

  return res.json({
    data: (data ?? []).map(toSearchEntry),
    meta: { page, pageSize, total: count ?? 0 }
  })
})

v1Router.post('/search', requireAuth, async (req, res) => {
  const { query } = req.body ?? {}
  if (!query || typeof query !== 'string') {
    return sendError(res, 400, 'validation_error', 'query is required')
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('search')
    .insert({ user_id: req.auth.userId, query })
    .select('*')
    .single()

  if (error) return sendError(res, 400, 'validation_error', error.message)

  return res.status(201).json(toSearchEntry(data))
})

v1Router.get('/search/:searchId', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('search')
    .select('*')
    .eq('search_id', req.params.searchId)
    .maybeSingle()

  if (error) return sendError(res, 400, 'unknown_error', error.message)
  if (!data) return sendError(res, 404, 'not_found', 'Search history entry not found')
  if (data.user_id !== req.auth.userId) {
    return sendError(res, 403, 'forbidden', 'Caller does not own the search history entry')
  }

  return res.json(toSearchEntry(data))
})

v1Router.patch('/search/:searchId', requireAuth, async (req, res) => {
  const { query } = req.body ?? {}
  if (!query || typeof query !== 'string') {
    return sendError(res, 400, 'validation_error', 'query is required')
  }

  const supabase = getSupabaseAdmin()

  const { data: existing, error: existingError } = await supabase
    .from('search')
    .select('search_id,user_id')
    .eq('search_id', req.params.searchId)
    .maybeSingle()

  if (existingError) return sendError(res, 400, 'unknown_error', existingError.message)
  if (!existing) return sendError(res, 404, 'not_found', 'Search history entry not found')
  if (existing.user_id !== req.auth.userId) {
    return sendError(res, 403, 'forbidden', 'Caller does not own the search history entry')
  }

  const { data, error } = await supabase
    .from('search')
    .update({ query })
    .eq('search_id', req.params.searchId)
    .select('*')
    .single()

  if (error) return sendError(res, 400, 'validation_error', error.message)

  return res.json(toSearchEntry(data))
})

v1Router.delete('/search/:searchId', requireAuth, async (req, res) => {
  const supabase = getSupabaseAdmin()

  const { data: existing, error: existingError } = await supabase
    .from('search')
    .select('search_id,user_id')
    .eq('search_id', req.params.searchId)
    .maybeSingle()

  if (existingError) return sendError(res, 400, 'unknown_error', existingError.message)
  if (!existing) return sendError(res, 404, 'not_found', 'Search history entry not found')
  if (existing.user_id !== req.auth.userId) {
    return sendError(res, 403, 'forbidden', 'Caller does not own the search history entry')
  }

  const { error } = await supabase.from('search').delete().eq('search_id', req.params.searchId)
  if (error) return sendError(res, 400, 'unknown_error', error.message)

  return res.status(204).send()
})
