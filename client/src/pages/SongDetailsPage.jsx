import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import Artwork from '../components/Artwork.jsx'
import SongCard from '../components/SongCard.jsx'
import { isInTop5, toggleTop5 } from '../lib/top5'
import { fetchMyTop5, updateMyTop5 } from '../lib/top5Remote'

export default function SongDetailsPage() {
  const { songId } = useParams()

  const { token, profile } = useAuth()
  const userId = profile?.id

  const [song, setSong] = useState(null)
  const [rating, setRating] = useState(null)
  const [bookmark, setBookmark] = useState(null)
  const [top5Ids, setTop5Ids] = useState([])

  const [ratingValue, setRatingValue] = useState('')
  const [review, setReview] = useState('')

  const [publicRatings, setPublicRatings] = useState([])
  const [myOutgoingFriends, setMyOutgoingFriends] = useState([])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const isSignedIn = Boolean(token)

  const effectiveRatingValue = useMemo(() => {
    if (ratingValue !== '') return ratingValue
    if (rating?.ratingValue != null) return String(rating.ratingValue)
    return ''
  }, [ratingValue, rating?.ratingValue])

  const effectiveReview = useMemo(() => {
    if (review !== '') return review
    return rating?.review ?? ''
  }, [review, rating?.review])

  async function load() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const songData = await apiFetch(`/songs/${songId}`)
      setSong(songData)

      const publicRatingsData = await apiFetch(`/songs/${songId}/ratings/public?page=1&pageSize=20`)
      setPublicRatings(publicRatingsData.data || [])

      if (token) {
        const outgoing = await apiFetch('/friends?direction=outgoing&page=1&pageSize=200', {
          headers: authHeaders(token)
        })
        setMyOutgoingFriends(outgoing.data || [])

        const ratings = await apiFetch(`/ratings?songId=${encodeURIComponent(songId)}&page=1&pageSize=1`, {
          headers: authHeaders(token)
        })
        setRating((ratings.data || [])[0] || null)

        const bookmarks = await apiFetch(`/bookmarks?songId=${encodeURIComponent(songId)}&page=1&pageSize=1`, {
          headers: authHeaders(token)
        })
        setBookmark((bookmarks.data || [])[0] || null)
      } else {
        setRating(null)
        setBookmark(null)
        setMyOutgoingFriends([])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId, token])

  useEffect(() => {
    let cancelled = false

    async function loadTop5() {
      if (!token || !userId) {
        setTop5Ids([])
        return
      }
      try {
        const entries = await fetchMyTop5(token, userId)
        if (!cancelled) setTop5Ids((entries || []).map((e) => e.songId).filter(Boolean))
      } catch {
        if (!cancelled) setTop5Ids([])
      }
    }

    loadTop5()
    return () => {
      cancelled = true
    }
  }, [token, userId])

  async function saveRating() {
    if (!token) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const valueNum = Number(effectiveRatingValue)
      if (!Number.isInteger(valueNum) || valueNum < 1 || valueNum > 5) {
        throw new Error('Rating must be an integer between 1 and 5')
      }

      const payload = {
        songId,
        ratingValue: valueNum,
        review: effectiveReview || null
      }

      if (rating?.ratingId) {
        const updated = await apiFetch(`/ratings/${rating.ratingId}`, {
          method: 'PATCH',
          headers: authHeaders(token),
          json: { ratingValue: valueNum, review: effectiveReview || null }
        })
        setRating(updated)
        setMessage('Rating updated.')
      } else {
        const created = await apiFetch('/ratings', {
          method: 'POST',
          headers: authHeaders(token),
          json: payload
        })
        setRating(created)
        setMessage('Rating created.')
      }

      setRatingValue('')
      setReview('')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleBookmark() {
    if (!token) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (bookmark?.bookmarkId) {
        await apiFetch(`/bookmarks/${bookmark.bookmarkId}`, {
          method: 'DELETE',
          headers: authHeaders(token)
        })
        setBookmark(null)
        setMessage('Bookmark removed.')
      } else {
        const created = await apiFetch('/bookmarks', {
          method: 'POST',
          headers: authHeaders(token),
          json: { songId }
        })
        setBookmark(created)
        setMessage('Bookmarked.')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function logListen() {
    if (!token) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await apiFetch('/listens', {
        method: 'POST',
        headers: authHeaders(token),
        json: { songId }
      })
      setMessage('Logged a listen.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function followByUsername(username) {
    if (!token) return
    const normalized = String(username || '').trim().replace(/^@/, '')
    if (!normalized) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await apiFetch('/friends', {
        method: 'POST',
        headers: authHeaders(token),
        json: { friendUsername: normalized }
      })

      const outgoing = await apiFetch('/friends?direction=outgoing&page=1&pageSize=200', {
        headers: authHeaders(token)
      })
      setMyOutgoingFriends(outgoing.data || [])
      setMessage('Following.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function unfollow(friendId) {
    if (!token || !friendId) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await apiFetch(`/friends/${friendId}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      })
      setMyOutgoingFriends((prev) => (prev || []).filter((f) => f.friendId !== friendId))
      setMessage('Unfollowed.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <div className="card" style={{ background: 'var(--panel2)' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row" style={{ alignItems: 'center' }}>
            <Artwork src={song?.albumArt} alt={song?.title ? `${song.title} album art` : 'Album art'} size={84} rounded={16} />
            <div>
              <h1 style={{ marginBottom: 6 }}>{song?.title || 'Song'}</h1>
              <div className="subtle">
                {song?.artist || ''}
                {song?.releaseYear ? ` • ${song.releaseYear}` : ''}
                {song?.genre ? ` • ${song.genre}` : ''}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              className={(token ? top5Ids.includes(songId) : isInTop5(userId, songId)) ? 'primary' : ''}
              onClick={async () => {
                if (token && userId) {
                  const inTop5 = top5Ids.includes(songId)
                  const next = inTop5
                    ? top5Ids.filter((id) => id !== songId)
                    : [...top5Ids, songId].slice(0, 5)
                  const entries = await updateMyTop5(token, next)
                  setTop5Ids((entries || []).map((e) => e.songId).filter(Boolean))
                } else {
                  toggleTop5(userId, songId)
                }
              }}
              disabled={busy}
              title="Manually select your Top 5 songs"
            >
              {(token ? top5Ids.includes(songId) : isInTop5(userId, songId)) ? 'In My Top 5' : 'Add to My Top 5'}
            </button>
          </div>
        </div>
      </div>

      {busy ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <section>
        <h2>Song metadata</h2>
        {song ? (
          <div className="listItem">
            <div style={{ fontWeight: 700 }}>{song.title}</div>
            <small>
              {song.artist} {song.genre ? `• ${song.genre}` : ''} {song.releaseYear ? `• ${song.releaseYear}` : ''}
            </small>
          </div>
        ) : (
          <p>—</p>
        )}
      </section>

      <section>
        <h2>Log a listen</h2>
        {isSignedIn ? (
          <>
            <p>Tap this when you listen to the song (adds to your History feed).</p>
            <button type="button" className="primary" onClick={logListen} disabled={busy}>
              Log listen
            </button>
          </>
        ) : (
          <p>Sign in to log listens.</p>
        )}
      </section>

      <section>
        <h2>Rate this song</h2>
        {isSignedIn ? (
          <>
            <p>Rate from 1–5 stars.</p>
            <div className="row" style={{ gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1
                const active = Number(effectiveRatingValue || 0) >= value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRatingValue(String(value))}
                    disabled={busy}
                    aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                    title={`Rate ${value} / 5`}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      fontSize: 26,
                      lineHeight: 1,
                      cursor: busy ? 'not-allowed' : 'pointer',
                      color: active ? 'var(--gold)' : 'var(--muted)'
                    }}
                  >
                    ★
                  </button>
                )
              })}

              {effectiveRatingValue ? <span className="subtle">{effectiveRatingValue} / 5</span> : null}
            </div>
            <button type="button" className="primary" onClick={saveRating} disabled={busy || !effectiveRatingValue}>
              {rating ? 'Update rating' : 'Save rating'}
            </button>
            {rating ? (
              <p>
                <small>
                  Current rating: <span className="badge">{rating.ratingValue} / 5</span>
                </small>
              </p>
            ) : null}
          </>
        ) : (
          <p>Sign in to rate and review.</p>
        )}
      </section>

      <section>
        <h2>Write a review</h2>
        {isSignedIn ? (
          <>
            <p>Write a short review (target ~500 characters).</p>
            <label>
              Review
              <textarea
                rows={4}
                value={effectiveReview}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your review..."
              />
            </label>
            <button type="button" className="primary" onClick={saveRating} disabled={busy || !effectiveRatingValue}>
              Save review
            </button>
          </>
        ) : (
          <p>Sign in to write a review.</p>
        )}
      </section>

      <section>
        <h2>Bookmark</h2>
        {isSignedIn ? (
          <>
            <p>Bookmark this song to revisit later.</p>
            <button type="button" className="primary" onClick={toggleBookmark} disabled={busy}>
              {bookmark ? 'Remove bookmark' : 'Bookmark'}
            </button>
          </>
        ) : (
          <p>Sign in to bookmark songs.</p>
        )}
      </section>

      <section>
        <h2>Recent reviews</h2>
        {publicRatings.filter((r) => r.profile && r.profile.username).length === 0 && !busy ? (
          <p className="subtle">No reviews yet.</p>
        ) : null}

        <div className="grid">
          {publicRatings
            .filter((r) => r.profile)
            .map((r) => {
              const username = r.profile?.username
              const existing = username
                ? (myOutgoingFriends || []).find((f) => f.friendProfile?.username === username) || null
                : null

              return (
                <SongCard
                  key={r.ratingId}
                  song={r.song}
                  to={r.songId ? `/songs/${r.songId}` : undefined}
                  rightSlot={<div className="row" style={{ alignItems: 'center' }}><div className="subtle">{username ? `@${username}` : ''}</div></div>}
                  footerSlot={
                    <>
                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="subtle">
                          {r.ratingValue ? `${r.ratingValue} / 5` : ''}
                          {r.createdAt ? ` • ${new Date(r.createdAt).toLocaleDateString()}` : ''}
                        </div>
                        {isSignedIn && username && username !== profile?.username ? (
                          existing?.friendId ? (
                            <button type="button" className="danger small" onClick={() => unfollow(existing.friendId)} disabled={busy}>
                              Unfollow
                            </button>
                          ) : (
                            <button type="button" className="primary small" onClick={() => followByUsername(username)} disabled={busy}>
                              Follow
                            </button>
                          )
                        ) : null}
                      </div>
                      {r.review ? <div style={{ marginTop: 6 }}>{r.review}</div> : null}
                    </>
                  }
                />
              )
            })}
        </div>
      </section>
    </main>
  )
}
