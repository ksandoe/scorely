import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { isInTop5, toggleTop5 } from '../lib/top5'
import { fetchMyTop5, updateMyTop5 } from '../lib/top5Remote'
import SongCard from '../components/SongCard.jsx'

export default function SongsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, token } = useAuth()
  const userId = profile?.id

  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [songs, setSongs] = useState([])
  const [top5Ids, setTop5Ids] = useState([])

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

  useEffect(() => {
    let cancelled = false

    async function loadTop5() {
      if (!token || !userId) {
        setTop5Ids([])
        return
      }
      try {
        const entries = await fetchMyTop5(token, userId)
        if (!cancelled) {
          setTop5Ids((entries || []).map((e) => e.songId).filter(Boolean))
        }
      } catch {
        if (!cancelled) setTop5Ids([])
      }
    }

    loadTop5()
    return () => {
      cancelled = true
    }
  }, [token, userId])

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
            const inTop5 = token ? top5Ids.includes(s.songId) : isInTop5(userId, s.songId)
            return (
              <SongCard
                key={s.songId}
                song={s}
                rightSlot={
                  <button
                    type="button"
                    className={inTop5 ? 'primary' : ''}
                    onClick={async () => {
                      if (token && userId) {
                        const next = inTop5
                          ? top5Ids.filter((id) => id !== s.songId)
                          : [...top5Ids, s.songId].slice(0, 5)

                        const entries = await updateMyTop5(token, next)
                        setTop5Ids((entries || []).map((e) => e.songId).filter(Boolean))
                      } else {
                        toggleTop5(userId, s.songId)
                      }
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
