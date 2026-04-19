import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { token, setToken, refreshProfile } = useAuth()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [createAccount, setCreateAccount] = useState(false)
  const [step, setStep] = useState('email')

  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [accountNotFound, setAccountNotFound] = useState(false)

  const effectiveEmail = useMemo(() => {
    return email.trim()
  }, [email])

  const canSend = Boolean(effectiveEmail)
  const canVerify = Boolean(effectiveEmail) && Boolean(otp)

  async function startOtp() {
    setBusy(true)
    setError('')
    setMessage('')
    setAccountNotFound(false)
    try {
      if (effectiveEmail.length > 254) {
        throw new Error('Email address is too long')
      }
      const data = await apiFetch('/auth/otp/start', {
        method: 'POST',
        json: { email: effectiveEmail, createAccount }
      })
      setMessage(data.message)
      setStep('code')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(nextCreateAccount) {
    const createAccountValue = nextCreateAccount ?? createAccount
    setBusy(true)
    setError('')
    setMessage('')
    setAccountNotFound(false)
    try {
      const session = await apiFetch('/auth/otp/verify', {
        method: 'POST',
        json: { email: effectiveEmail, token: otp, createAccount: createAccountValue }
      })

      setToken(session.accessToken)
      const me = await refreshProfile(session.accessToken)

      if (!me?.username) {
        // keep the flow simple: user can set username on /me
      }

      if (session.isNewUser) {
        navigate('/me')
      } else {
        navigate('/')
      }
    } catch (e) {
      if (e?.payload?.error === 'account_not_found') {
        setAccountNotFound(true)
      }
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>{token ? 'Signed in' : 'Log in'}</h1>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <section>
        <h2>One-time code</h2>

        {step === 'email' ? (
          <>
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

            <label>
              <input
                type="checkbox"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                style={{ width: 'auto', marginRight: 8 }}
              />
              Create account
            </label>

            <div className="row">
              <button type="button" className="primary" onClick={startOtp} disabled={busy || !canSend}>
                Send code
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="row">
              <div style={{ flex: 1, minWidth: 240 }}>
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

              <div style={{ flex: 1, minWidth: 240 }}>
                <label>
                  Code
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </label>
              </div>
            </div>

            <label>
              <input
                type="checkbox"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                style={{ width: 'auto', marginRight: 8 }}
              />
              Create account
            </label>

            <div className="row">
              <button type="button" onClick={() => setStep('email')} disabled={busy}>
                Back
              </button>
              <button type="button" className="primary" onClick={() => verifyOtp()} disabled={busy || !canVerify}>
                Verify & continue
              </button>
            </div>

            {accountNotFound ? (
              <div className="row" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setCreateAccount(true)
                    verifyOtp(true)
                  }}
                  disabled={busy}
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setToken(null)
                    navigate('/')
                  }}
                  disabled={busy}
                >
                  Browse as guest
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  )
}
