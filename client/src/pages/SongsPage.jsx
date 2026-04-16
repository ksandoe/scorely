import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'

export default function SongsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [songs, setSongs] = useState([])

  async function load() {
    setBusy(true)
    setError('')
    try {
      const qs = new URLSearchParams()
      if (q) qs.set('q', q)
      qs.set('page', '1')
      qs.set('pageSize', '20')

      const data = await apiFetch(`/songs?${qs.toString()}`)
      setSongs(data.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const initialQ = searchParams.get('q') || ''
    if (initialQ) setQ(initialQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <main>
      <h1>Songs</h1>

      <section>
        <h2>Search</h2>
        <div className="row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>
              Query
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or artist" />
            </label>
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button
              type="button"
              className="primary"
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                if (q) next.set('q', q)
                else next.delete('q')
                setSearchParams(next)
              }}
              disabled={busy}
            >
              Search
            </button>
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section>
        <h2>Results</h2>
        {busy ? <p>Loading…</p> : null}

        <div className="list">
          {songs.map((s) => (
            <div key={s.songId} className="listItem">
              <div>
                <Link to={`/songs/${s.songId}`}>{s.title}</Link>
              </div>
              <small>
                {s.artist} {s.genre ? `• ${s.genre}` : ''} {s.releaseYear ? `• ${s.releaseYear}` : ''}
              </small>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
