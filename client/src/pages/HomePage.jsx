import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'

export default function HomePage() {
  const [health, setHealth] = useState(null)
  const [songs, setSongs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      try {
        const h = await apiFetch('/health')
        const s = await apiFetch('/songs?page=1&pageSize=5')
        if (!cancelled) {
          setHealth(h)
          setSongs(s.data || [])
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
      <p>Frontend + API are wired together for interactive testing.</p>

      {error ? <p className="error">{error}</p> : null}

      <section>
        <h2>Status</h2>
        <p>
          API health: <span className="badge">{health?.status || 'unknown'}</span>
        </p>
      </section>

      <section>
        <h2>Quick links</h2>
        <ul>
          <li>
            <Link to="/account">Account (OTP login)</Link>
          </li>
          <li>
            <Link to="/discover">Discover (search)</Link>
          </li>
          <li>
            <Link to="/songs">Songs</Link>
          </li>
          <li>
            <Link to="/history">History (ratings)</Link>
          </li>
          <li>
            <Link to="/bookmarks">Bookmarks</Link>
          </li>
          <li>
            <Link to="/friends">Friends</Link>
          </li>
        </ul>
      </section>

      <section>
        <h2>Recent songs</h2>
        <div className="list">
          {songs.map((s) => (
            <div key={s.songId} className="listItem">
              <div>
                <Link to={`/songs/${s.songId}`}>{s.title}</Link>
              </div>
              <small>{s.artist}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
