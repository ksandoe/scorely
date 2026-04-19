import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { getTop5, moveTop5, setTop5, toggleTop5 } from '../lib/top5'
import SongCard from '../components/SongCard.jsx'

export default function HomePage() {
  const { profile } = useAuth()
  const userId = profile?.id

  const [health, setHealth] = useState(null)
  const [songs, setSongs] = useState([])
  const [top5Songs, setTop5Songs] = useState([])
  const [error, setError] = useState('')
  const [top5Nonce, setTop5Nonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      try {
        const h = await apiFetch('/health')
        const s = await apiFetch('/songs?page=1&pageSize=5')

        const top5Ids = getTop5(userId)
        const top5Details = await Promise.all(
          top5Ids.map(async (id) => {
            try {
              return await apiFetch(`/songs/${id}`)
            } catch {
              return null
            }
          })
        )

        if (!cancelled) {
          setHealth(h)
          setSongs(s.data || [])
          setTop5Songs(top5Details.filter(Boolean))
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main>
      <h1>Scorely</h1>
      <p className="subtle">A music diary with artwork-first cards, ratings, and friend activity.</p>

      {error ? <p className="error">{error}</p> : null}

      <section>
        <h2>Status</h2>
        <p>
          API health: <span className="badge">{health?.status || 'unknown'}</span>
        </p>
      </section>

      <section>
        <h2>My Top 5</h2>
        <p className="subtle">Manually curated. Add songs from the Songs page or Song Details.</p>

        {top5Songs.length === 0 ? <p>No Top 5 songs selected yet.</p> : null}

        <div className="grid">
          {top5Songs.map((s, idx) => (
            <SongCard
              key={s.songId}
              song={s}
              rightSlot={
                <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      moveTop5(userId, idx, -1)
                      setTop5Nonce((n) => n + 1)
                    }}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      moveTop5(userId, idx, 1)
                      setTop5Nonce((n) => n + 1)
                    }}
                    disabled={idx === top5Songs.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      toggleTop5(userId, s.songId)
                      setTop5Nonce((n) => n + 1)
                    }}
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              }
            />
          ))}
        </div>

        {top5Songs.some((s) => !s) ? (
          <button
            type="button"
            onClick={() => {
              const cleaned = getTop5(userId).filter(Boolean)
              setTop5(userId, cleaned)
              setTop5Nonce((n) => n + 1)
            }}
          >
            Clean up Top 5
          </button>
        ) : null}
      </section>

      <section>
        <h2>Recent songs</h2>
        <div className="grid">
          {songs.map((s) => (
            <SongCard key={s.songId} song={s} />
          ))}
        </div>
      </section>
    </main>
  )
}
