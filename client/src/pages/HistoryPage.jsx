import { useEffect, useMemo, useState } from 'react'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import SongCard from '../components/SongCard.jsx'

export default function HistoryPage() {
  const { token } = useAuth()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [listens, setListens] = useState([])

  const isSignedIn = Boolean(token)

  const displayed = useMemo(() => {
    return listens
  }, [listens])

  async function load() {
    if (!token) return
    setBusy(true)
    setError('')
    try {
      const data = await apiFetch('/listens?page=1&pageSize=100', {
        headers: authHeaders(token)
      })
      setListens(data.data || [])
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
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>History</h2>
              <button type="button" className="primary" onClick={load} disabled={busy}>
                Refresh
              </button>
            </div>
            {busy ? <p>Loading…</p> : null}
            {error ? <p className="error">{error}</p> : null}

            {displayed.length === 0 && !busy ? (
              <p>No listens yet. Start by logging a listen on a song.</p>
            ) : null}

            <div className="grid">
              {displayed
                .filter((l) => l.song)
                .map((l) => (
                  <SongCard
                    key={l.listenId}
                    song={l.song}
                    to={`/songs/${l.songId}`}
                    footerSlot={
                      <>
                        {l.listenedAt ? (
                          <div className="subtle">Listened on {new Date(l.listenedAt).toLocaleString()}</div>
                        ) : null}
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
