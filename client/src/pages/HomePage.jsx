import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { getTop5, moveTop5, setTop5, toggleTop5 } from '../lib/top5'
import { fetchMyTop5, updateMyTop5 } from '../lib/top5Remote'
import SongCard from '../components/SongCard.jsx'

export default function HomePage() {
  const { profile, token } = useAuth()
  const userId = profile?.id

  const [health, setHealth] = useState(null)
  const [songs, setSongs] = useState([])
  const [top5Songs, setTop5Songs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      try {
        const h = await apiFetch('/health')
        const s = await apiFetch('/songs?page=1&pageSize=5')

        let top5Details = []
        if (token && userId) {
          const entries = await fetchMyTop5(token, userId)
          top5Details = (entries || []).map((e) => e.song).filter(Boolean)
        } else {
          const top5Ids = getTop5(userId)
          top5Details = await Promise.all(
            top5Ids.map(async (id) => {
              try {
                return await apiFetch(`/songs/${id}`)
              } catch {
                return null
              }
            })
          )
          top5Details = top5Details.filter(Boolean)
        }

        if (!cancelled) {
          setHealth(h)
          setSongs(s.data || [])
          setTop5Songs(top5Details)
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
                      if (token) return
                      moveTop5(userId, idx, -1)
                    }}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (token) return
                      moveTop5(userId, idx, 1)
                    }}
                    disabled={idx === top5Songs.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={async () => {
                      if (token && userId) {
                        const nextIds = top5Songs.filter((x) => x.songId !== s.songId).map((x) => x.songId)
                        const entries = await updateMyTop5(token, nextIds)
                        setTop5Songs((entries || []).map((e) => e.song).filter(Boolean))
                      } else {
                        toggleTop5(userId, s.songId)
                        const next = getTop5(userId)
                        const refreshed = await Promise.all(
                          next.map(async (id) => {
                            try {
                              return await apiFetch(`/songs/${id}`)
                            } catch {
                              return null
                            }
                          })
                        )
                        setTop5Songs(refreshed.filter(Boolean))
                      }
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
