import { useMemo, useState } from 'react'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function AccountPage() {
  const { token, setToken, profile, logout } = useAuth()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const effectiveUsername = useMemo(() => {
    if (username) return username
    return profile?.username ?? ''
  }, [username, profile?.username])

  async function startOtp() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const data = await apiFetch('/auth/otp/start', {
        method: 'POST',
        json: { email }
      })
      setMessage(data.message)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const session = await apiFetch('/auth/otp/verify', {
        method: 'POST',
        json: { email, token: otp }
      })

      setToken(session.accessToken)
      setMessage('Signed in.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function updateProfile() {
    if (!token) return
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
      setMessage('Profile updated.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>Manage Account</h1>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <section>
        <h2>Authentication (OTP)</h2>

        <div className="row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <label>
              OTP code
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
              />
            </label>
          </div>
        </div>

        <div className="row">
          <button type="button" className="primary" onClick={startOtp} disabled={busy || !email}>
            Send OTP
          </button>
          <button type="button" className="primary" onClick={verifyOtp} disabled={busy || !email || !otp}>
            Verify OTP
          </button>
          {token ? (
            <button type="button" className="danger" onClick={logout} disabled={busy}>
              Logout
            </button>
          ) : null}
        </div>

        <small>
          This app uses the API wrappers: <code>POST /auth/otp/start</code> and <code>POST /auth/otp/verify</code>.
        </small>
      </section>

      <section>
        <h2>Profile</h2>
        {token ? (
          <>
            <p>
              Signed in as: <span className="badge">@{profile?.username ?? '...'}</span>
            </p>
            <label>
              Username
              <input
                value={effectiveUsername}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
            </label>
            <button type="button" className="primary" onClick={updateProfile} disabled={busy || !effectiveUsername}>
              Save username
            </button>
          </>
        ) : (
          <p>Sign in to view and update your profile.</p>
        )}
      </section>

      <section>
        <h2>Note</h2>
        <p>
          Username/password sign-up is not implemented because the authoritative API spec uses OTP-based authentication.
        </p>
      </section>
    </main>
  )
}
