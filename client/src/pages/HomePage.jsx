import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { moveTop5, toggleTop5 } from '../lib/top5'
import { fetchMyTop5, updateMyTop5 } from '../lib/top5Remote'
import SongCard from '../components/SongCard.jsx'

export default function HomePage() {
  const { profile, token } = useAuth()
  const userId = profile?.id
  const isSignedIn = Boolean(token)

  const [songs, setSongs] = useState([])
  const [top5Songs, setTop5Songs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      try {
        const s = await apiFetch('/songs?page=1&pageSize=5')

        let top5Details = []
        if (token && userId) {
          const entries = await fetchMyTop5(token, userId)
          top5Details = (entries || []).map((e) => e.song).filter(Boolean)
        }

        if (!cancelled) {
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
      <p className="subtle">Track your listens. Curate your favorites. Share with friends.</p>

      {error ? <p className="error">{error}</p> : null}

      {isSignedIn ? (
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
                      className="small"
                      onClick={() => {
                        if (token && userId) {
                          const nextIds = [...top5Songs]
                            .map((x) => x.songId)
                            .map((id, i) => ({ id, i }))
                          const current = nextIds[idx]
                          const prev = nextIds[idx - 1]
                          if (!prev) return
                          nextIds[idx] = prev
                          nextIds[idx - 1] = current
                          updateMyTop5(token, nextIds.map((x) => x.id)).then((entries) => {
                            setTop5Songs((entries || []).map((e) => e.song).filter(Boolean))
                          })
                        } else {
                          moveTop5(userId, idx, -1)
                        }
                      }}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="small"
                      onClick={() => {
                        if (token && userId) {
                          const nextIds = [...top5Songs]
                            .map((x) => x.songId)
                            .map((id, i) => ({ id, i }))
                          const current = nextIds[idx]
                          const next = nextIds[idx + 1]
                          if (!next) return
                          nextIds[idx] = next
                          nextIds[idx + 1] = current
                          updateMyTop5(token, nextIds.map((x) => x.id)).then((entries) => {
                            setTop5Songs((entries || []).map((e) => e.song).filter(Boolean))
                          })
                        } else {
                          moveTop5(userId, idx, 1)
                        }
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
      ) : null}

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
