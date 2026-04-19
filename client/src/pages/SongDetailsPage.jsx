import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import Artwork from '../components/Artwork.jsx'
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

      if (token) {
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
        <h2>Rate this song</h2>
        {isSignedIn ? (
          <>
            <p>Rate from 1–5 stars.</p>
            <div className="row">
              <div style={{ flex: 1, minWidth: 160 }}>
                <label>
                  Rating
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={effectiveRatingValue}
                    onChange={(e) => setRatingValue(e.target.value)}
                    placeholder="5"
                  />
                </label>
              </div>
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
    </main>
  )
}
