import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getApiBaseUrl } from '../lib/api'

export default function PageHeader() {
  const { profile, token, logout, status } = useAuth()

  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div className="brand">
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text)' }}>
            Scorely
          </Link>
        </div>
        <small className="subtle">API: {getApiBaseUrl() || 'not configured'}</small>
      </div>

      <div style={{ textAlign: 'right' }}>
        {status === 'loading' ? <small>Loading session…</small> : null}
        {token && profile ? (
          <div>
            <div>
              <span className="pill">@{profile.username}</span>
            </div>
            <button type="button" className="danger" onClick={logout} style={{ marginTop: 6 }}>
              Logout
            </button>
          </div>
        ) : (
          <small>
            <Link to="/account">Not signed in</Link>
          </small>
        )}
      </div>
    </div>
  )
}
