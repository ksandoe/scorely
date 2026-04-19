import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function PageHeader() {
  const { profile, token, status } = useAuth()

  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div className="brand">
          <Link to="/" className="brandLink">
            <span className="brandMark" aria-hidden="true" />
            <span>Scorely</span>
          </Link>
        </div>
        <small className="subtle">Music diary</small>
      </div>

      <div style={{ textAlign: 'right' }}>
        {status === 'loading' ? <small>Loading session…</small> : null}
        {token && profile ? (
          <Link to="/me" className="pill" style={{ textDecoration: 'none' }}>
            @{profile.username}
          </Link>
        ) : (
          <Link to="/login" className="pill" style={{ textDecoration: 'none' }}>
            Login
          </Link>
        )}
      </div>
    </div>
  )
}
