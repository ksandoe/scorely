import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProfilePage() {
  const { userId } = useParams()
  const { token } = useAuth()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!token) return
      setBusy(true)
      setError('')

      try {
        const p = await apiFetch(`/profiles/${userId}`, {
          headers: authHeaders(token)
        })

        const r = await apiFetch(`/ratings?userId=${encodeURIComponent(userId)}&page=1&pageSize=50`, {
          headers: authHeaders(token)
        })

        if (!cancelled) {
          setProfile(p)
          setRatings(r.data || [])
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [token, userId])

  if (!token) {
    return (
      <main>
        <h1>Profile</h1>
        <p>Sign in to view profiles.</p>
      </main>
    )
  }

  return (
    <main>
      <h1>Profile</h1>
      <p>
        User ID: <code>{userId}</code>
      </p>

      {busy ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <section>
        <h2>Profile</h2>
        {profile ? (
          <div className="listItem">
            <div style={{ fontWeight: 700 }}>@{profile.username}</div>
            <small>{profile.createdAt ? `Joined ${new Date(profile.createdAt).toLocaleDateString()}` : null}</small>
          </div>
        ) : (
          <p>—</p>
        )}
      </section>

      <section>
        <h2>Ratings</h2>
        <div className="list">
          {ratings.map((r) => (
            <div key={r.ratingId} className="listItem">
              <div>
                <Link to={`/songs/${r.songId}`}>{r.song?.title || r.songId}</Link>
              </div>
              <small>
                {r.song?.artist ? `${r.song.artist} • ` : ''}
                <span className="badge">{r.ratingValue} / 5</span>
              </small>
              {r.review ? <small>{r.review}</small> : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
