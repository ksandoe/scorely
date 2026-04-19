import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { isInTop5, toggleTop5 } from '../lib/top5'
import SongCard from '../components/SongCard.jsx'

export default function SongsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuth()
  const userId = profile?.id

  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [songs, setSongs] = useState([])
  const [top5Nonce, setTop5Nonce] = useState(0)

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

        <div className="grid">
          {songs.map((s) => {
            const inTop5 = isInTop5(userId, s.songId)
            return (
              <SongCard
                key={s.songId}
                song={s}
                rightSlot={
                  <button
                    type="button"
                    className={inTop5 ? 'primary' : ''}
                    onClick={() => {
                      toggleTop5(userId, s.songId)
                      setTop5Nonce((n) => n + 1)
                    }}
                    disabled={busy}
                    aria-label={inTop5 ? 'Remove from Top 5' : 'Add to Top 5'}
                  >
                    {inTop5 ? 'Top 5' : '+ Top 5'}
                  </button>
                }
              />
            )
          })}
        </div>
      </section>
    </main>
  )
}
