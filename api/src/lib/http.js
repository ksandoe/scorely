export function sendError(res, status, error, message, details) {
  const payload = { error, message }
  if (details) payload.details = details
  return res.status(status).json(payload)
}

export function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1)
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(query.pageSize ?? '20', 10) || 20)
  )
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { page, pageSize, from, to }
}

export function toProfile(row) {
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at
  }
}

export function toSong(row) {
  if (!row) return null
  return {
    songId: row.song_id,
    title: row.title,
    artist: row.artist,
    albumArt: row.album_art,
    genre: row.genre,
    releaseYear: row.release_year,
    createdAt: row.created_at
  }
}

export function toRating(row) {
  if (!row) return null
  return {
    ratingId: row.rating_id,
    userId: row.user_id,
    songId: row.song_id,
    ratingValue: row.rating_value,
    review: row.review,
    createdAt: row.created_at,
    song: row.song ? toSong(row.song) : undefined,
    profile: row.profile ? toProfile(row.profile) : undefined
  }
}

export function toBookmark(row) {
  if (!row) return null
  return {
    bookmarkId: row.bookmark_id,
    userId: row.user_id,
    songId: row.song_id,
    createdAt: row.created_at,
    song: row.song ? toSong(row.song) : undefined
  }
}

export function toFriend(row) {
  if (!row) return null
  return {
    friendId: row.friend_id,
    userId: row.user_id,
    friendUserId: row.friend_user_id,
    createdAt: row.created_at,
    friendProfile: row.friendProfile ? toProfile(row.friendProfile) : undefined
  }
}

export function toSearchEntry(row) {
  if (!row) return null
  return {
    searchId: row.search_id,
    userId: row.user_id,
    query: row.query,
    searchedAt: row.searched_at
  }
}

export function toTop5Entry(row) {
  if (!row) return null
  return {
    top5Id: row.top5_id,
    userId: row.user_id,
    songId: row.song_id,
    position: row.position,
    createdAt: row.created_at,
    song: row.song ? toSong(row.song) : undefined
  }
}
