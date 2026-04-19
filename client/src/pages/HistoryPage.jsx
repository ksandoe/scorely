import { useEffect, useMemo, useState } from 'react'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import RatingPill from '../components/RatingPill.jsx'
import SongCard from '../components/SongCard.jsx'

export default function HistoryPage() {
  const { token } = useAuth()

  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('date')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ratings, setRatings] = useState([])

  const isSignedIn = Boolean(token)

  const displayed = useMemo(() => {
    let items = ratings

    if (filter === 'top') {
      items = items.filter((r) => r.ratingValue === 4 || r.ratingValue === 5)
    }

    if (sort === 'artist') {
      items = [...items].sort((a, b) => (a.song?.artist || '').localeCompare(b.song?.artist || ''))
    } else if (sort === 'genre') {
      items = [...items].sort((a, b) => (a.song?.genre || '').localeCompare(b.song?.genre || ''))
    } else if (sort === 'year') {
      items = [...items].sort((a, b) => (a.song?.releaseYear || 0) - (b.song?.releaseYear || 0))
    } else {
      items = [...items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    }

    return items
  }, [filter, sort, ratings])

  async function load() {
    if (!token) return
    setBusy(true)
    setError('')
    try {
      const data = await apiFetch('/ratings?page=1&pageSize=100', {
        headers: authHeaders(token)
      })
      setRatings(data.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (token) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <main>
      <h1>Listening History</h1>

      {!isSignedIn ? <p>Sign in to view your listening history.</p> : null}

      {isSignedIn ? (
        <>
          <section>
            <h2>Filters and sorting</h2>
            <div className="row">
              <div style={{ flex: 1, minWidth: 200 }}>
                <label>
                  Filter
                  <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All ratings</option>
                    <option value="top">4–5 stars</option>
                  </select>
                </label>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label>
                  Sort
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="date">Date rated</option>
                    <option value="genre">Genre</option>
                    <option value="artist">Artist</option>
                    <option value="year">Year released</option>
                  </select>
                </label>
              </div>
              <div style={{ alignSelf: 'end' }}>
                <button type="button" className="primary" onClick={load} disabled={busy}>
                  Refresh
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2>History list</h2>
            {busy ? <p>Loading…</p> : null}
            {error ? <p className="error">{error}</p> : null}

            {displayed.length === 0 && !busy ? (
              <p>
                No ratings yet. Start by browsing songs.
              </p>
            ) : null}

            <div className="grid">
              {displayed
                .filter((r) => r.song)
                .map((r) => (
                  <SongCard
                    key={r.ratingId}
                    song={r.song}
                    to={`/songs/${r.songId}`}
                    rightSlot={<RatingPill value={r.ratingValue} />}
                    footerSlot={
                      <>
                        {r.createdAt ? (
                          <div className="subtle">Rated on {new Date(r.createdAt).toLocaleString()}</div>
                        ) : null}
                        {r.review ? <div style={{ marginTop: 6 }}>{r.review}</div> : null}
                      </>
                    }
                  />
                ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  )
}
