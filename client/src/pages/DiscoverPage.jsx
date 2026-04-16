import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function DiscoverPage() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function runSearch() {
    setBusy(true)
    setError('')
    try {
      if (token && q) {
        await apiFetch('/search', {
          method: 'POST',
          headers: authHeaders(token),
          json: { query: q }
        })
      }

      const qs = new URLSearchParams()
      if (q) qs.set('q', q)
      navigate(`/songs?${qs.toString()}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>Discover Music</h1>

      <section>
        <h2>Search songs</h2>
        <p>Search the song catalog to find songs to rate and review.</p>

        <label>
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or artist"
          />
        </label>

        <div className="row">
          <button type="button" className="primary" onClick={runSearch} disabled={busy}>
            Search
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}
        <small>
          When signed in, your search query is saved via <code>POST /search</code>.
        </small>
      </section>

      <section>
        <h2>Friends' Top 5</h2>
        <p>
          This view will be driven by friends’ ratings. For now, use the Friends page to view a friends feed.
        </p>
      </section>
    </main>
  )
}
