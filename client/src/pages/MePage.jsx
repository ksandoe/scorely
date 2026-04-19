import { useMemo, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function MePage() {
  const { token, profile, logout, refreshProfile } = useAuth()

  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const effectiveUsername = useMemo(() => {
    if (username) return username
    return profile?.username ?? ''
  }, [username, profile?.username])

  if (!token) return <Navigate to="/login" replace />

  async function save() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await apiFetch('/profiles/me', {
        method: 'PATCH',
        headers: authHeaders(token),
        json: { username: effectiveUsername }
      })
      setUsername('')
      await refreshProfile(token)
      setMessage('Profile updated.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>My profile</h1>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <section>
        <h2>Account</h2>
        <p>
          Signed in as: <span className="badge">@{profile?.username ?? '...'}</span>
        </p>

        <div className="row">
          <button type="button" className="danger" onClick={logout} disabled={busy}>
            Logout
          </button>
        </div>
      </section>

      <section>
        <h2>Profile</h2>

        <label>
          Username
          <input value={effectiveUsername} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        </label>

        <div className="row">
          <button type="button" className="primary" onClick={save} disabled={busy || !effectiveUsername}>
            Save
          </button>
          {profile?.id ? (
            <Link to={`/profiles/${profile.id}`} className="pill" style={{ textDecoration: 'none' }}>
              View public profile
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  )
}
