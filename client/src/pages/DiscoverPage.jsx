import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import RatingPill from '../components/RatingPill.jsx'
import SongCard from '../components/SongCard.jsx'

export default function DiscoverPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const isSignedIn = Boolean(token)

  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [extBusy, setExtBusy] = useState(false)
  const [extError, setExtError] = useState('')
  const [extResults, setExtResults] = useState([])
  const [importingExternalId, setImportingExternalId] = useState('')
  const [importMessage, setImportMessage] = useState('')

  const [feedBusy, setFeedBusy] = useState(false)
  const [feedError, setFeedError] = useState('')
  const [feed, setFeed] = useState([])

  useEffect(() => {
    let cancelled = false

    async function loadFeed() {
      if (!token) return
      setFeedBusy(true)
      setFeedError('')
      try {
        const ratings = await apiFetch('/ratings?friendOnly=true&page=1&pageSize=6', {
          headers: authHeaders(token)
        })
        if (!cancelled) setFeed(ratings.data || [])
      } catch (e) {
        if (!cancelled) setFeedError(e.message)
      } finally {
        if (!cancelled) setFeedBusy(false)
      }
    }

    loadFeed()
    return () => {
      cancelled = true
    }
  }, [token])

  async function runSearch() {
    setBusy(true)
    setError('')
    try {
      if (token && q) {
        await apiFetch('/search', {
          method: 'POST',
          headers: authHeaders(token),
          json: { query: q }
        })
      }

      const qs = new URLSearchParams()
      if (q) qs.set('q', q)
      navigate(`/songs?${qs.toString()}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function runExternalSearch() {
    const term = q.trim()
    if (!term) return
    setExtBusy(true)
    setExtError('')
    setImportMessage('')
    try {
      const r = await apiFetch(`/discover/itunes?q=${encodeURIComponent(term)}&limit=12`)
      setExtResults(r.data || [])
    } catch (e) {
      setExtError(e.message)
    } finally {
      setExtBusy(false)
    }
  }

  async function importResult(item) {
    if (!token) return
    setImportingExternalId(item.externalId)
    setImportMessage('')
    setExtError('')
    try {
      const song = await apiFetch('/songs/import', {
        method: 'POST',
        headers: authHeaders(token),
        json: {
          source: item.source,
          externalId: item.externalId,
          title: item.title,
          artist: item.artist,
          albumArt: item.albumArt,
          genre: item.genre,
          releaseYear: item.releaseYear
        }
      })

      setImportMessage(`Added “${song.title}” to Scorely.`)
      navigate(`/songs/${song.songId}`)
    } catch (e) {
      setExtError(e.message)
    } finally {
      setImportingExternalId('')
    }
  }

  return (
    <main>
      <h1>Discover Music</h1>

      <section>
        <h2>Your shelves</h2>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800 }}>My Top 5</div>
            <div className="subtle" style={{ marginTop: 2 }}>
              Curate your five favorites and share them on your profile.
            </div>
          </div>
          <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
            <Link className="pill" to="/">
              Edit Top 5
            </Link>
            <Link className="pill" to="/friends">
              Friends
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2>Search songs</h2>
        <p>Search the song catalog to find songs to rate and review.</p>

        <label>
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or artist"
          />
        </label>

        <div className="row">
          <button type="button" className="primary" onClick={runSearch} disabled={busy}>
            Search Scorely
          </button>
          <button type="button" onClick={runExternalSearch} disabled={extBusy || !q.trim()}>
            Search iTunes
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {extError ? <p className="error">{extError}</p> : null}
        {importMessage ? <p>{importMessage}</p> : null}

        {extBusy ? <p>Searching…</p> : null}

        {extResults.length > 0 ? (
          <div style={{ marginTop: 10 }}>
            <div className="grid">
              {extResults.map((r) => (
                <SongCard
                  key={`${r.source}:${r.externalId}`}
                  song={{
                    songId: `external:${r.source}:${r.externalId}`,
                    title: r.title,
                    artist: r.artist,
                    albumArt: r.albumArt,
                    genre: r.genre,
                    releaseYear: r.releaseYear
                  }}
                  to={undefined}
                  rightSlot={
                    isSignedIn ? (
                      <button
                        type="button"
                        className="primary small"
                        onClick={() => importResult(r)}
                        disabled={Boolean(importingExternalId) && importingExternalId !== r.externalId}
                        title="Add to Scorely"
                      >
                        {importingExternalId === r.externalId ? 'Adding…' : 'Add'}
                      </button>
                    ) : (
                      <Link to="/login" className="pill" style={{ textDecoration: 'none' }}>
                        Log in to add
                      </Link>
                    )
                  }
                />
              ))}
            </div>
            <small className="subtle">Results powered by iTunes Search.</small>
          </div>
        ) : null}
      </section>

      <section>
        <h2>From your friends</h2>

        {!isSignedIn ? <p>Sign in to see recent activity from friends.</p> : null}
        {isSignedIn && feedError ? <p className="error">{feedError}</p> : null}
        {isSignedIn && feedBusy ? <p>Loading…</p> : null}

        {isSignedIn && !feedBusy && feed.filter((r) => r.song).length === 0 ? (
          <p className="subtle">No friend activity yet. Add a friend to start seeing ratings here.</p>
        ) : null}

        <div className="grid">
          {feed
            .filter((r) => r.song)
            .map((r) => (
              <SongCard
                key={r.ratingId}
                song={r.song}
                to={`/songs/${r.songId}`}
                rightSlot={<RatingPill value={r.ratingValue} />}
                footerSlot={
                  <div className="subtle">
                    {r.profile?.username ? `@${r.profile.username}` : ''}
                    {r.createdAt ? ` • ${new Date(r.createdAt).toLocaleDateString()}` : ''}
                  </div>
                }
              />
            ))}
        </div>
      </section>
    </main>
  )
}
