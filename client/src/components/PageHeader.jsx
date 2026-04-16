import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function PageHeader() {
  const { profile, token, logout, status } = useAuth()

  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 700 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            Scorely
          </Link>
        </div>
        <small>
          API: <code>{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/v1'}</code>
        </small>
      </div>

      <div style={{ textAlign: 'right' }}>
        {status === 'loading' ? <small>Loading session…</small> : null}
        {token && profile ? (
          <div>
            <div>
              <span className="badge">@{profile.username}</span>
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
