import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function BookmarksPage() {
  const { token } = useAuth()
  const isSignedIn = Boolean(token)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  async function load() {
    if (!token) return
    setBusy(true)
    setError('')
    try {
      const data = await apiFetch('/bookmarks?page=1&pageSize=100', {
        headers: authHeaders(token)
      })
      setItems(data.data || [])
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

  async function remove(bookmarkId) {
    if (!token) return
    setBusy(true)
    setError('')
    try {
      await apiFetch(`/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      })
      setItems((prev) => prev.filter((b) => b.bookmarkId !== bookmarkId))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>Bookmarks</h1>

      {!isSignedIn ? <p>Sign in to view your bookmarks.</p> : null}

      {isSignedIn ? (
        <>
          <section>
            <h2>Bookmarked songs</h2>
            <div className="row">
              <button type="button" className="primary" onClick={load} disabled={busy}>
                Refresh
              </button>
            </div>

            {busy ? <p>Loading…</p> : null}
            {error ? <p className="error">{error}</p> : null}

            {items.length === 0 && !busy ? (
              <p>
                No bookmarks yet. Browse <Link to="/songs">songs</Link> and bookmark one.
              </p>
            ) : null}

            <div className="list">
              {items.map((b) => (
                <div key={b.bookmarkId} className="listItem">
                  <div>
                    <Link to={`/songs/${b.songId}`}>{b.song?.title || b.songId}</Link>
                  </div>
                  <small>{b.song?.artist || ''}</small>
                  <div className="row">
                    <button type="button" className="danger" onClick={() => remove(b.bookmarkId)} disabled={busy}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  )
}
