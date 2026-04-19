import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import RatingPill from '../components/RatingPill.jsx'
import SongCard from '../components/SongCard.jsx'

export default function FriendsPage() {
  const { token } = useAuth()
  const isSignedIn = Boolean(token)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [friendUserId, setFriendUserId] = useState('')
  const [friends, setFriends] = useState([])
  const [feed, setFeed] = useState([])

  async function load() {
    if (!token) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const list = await apiFetch('/friends?page=1&pageSize=100', {
        headers: authHeaders(token)
      })
      setFriends(list.data || [])

      const ratings = await apiFetch('/ratings?friendOnly=true&page=1&pageSize=50', {
        headers: authHeaders(token)
      })
      setFeed(ratings.data || [])
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

  async function addFriend() {
    if (!token) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await apiFetch('/friends', {
        method: 'POST',
        headers: authHeaders(token),
        json: { friendUserId }
      })
      setFriendUserId('')
      setMessage('Friend added.')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>Friends</h1>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      {!isSignedIn ? <p>Sign in to manage friends and view the friends feed.</p> : null}

      {isSignedIn ? (
        <>
          <section>
            <h2>Add friend</h2>
            <label>
              Friend user ID (UUID)
              <input value={friendUserId} onChange={(e) => setFriendUserId(e.target.value)} placeholder="UUID" />
            </label>
            <div className="row">
              <button type="button" className="primary" onClick={addFriend} disabled={busy || !friendUserId}>
                Add
              </button>
              <button type="button" onClick={load} disabled={busy}>
                Refresh
              </button>
            </div>
          </section>

          <section>
            <h2>Friends list</h2>
            {busy ? <p>Loading…</p> : null}
            {friends.length === 0 && !busy ? <p>No friends yet.</p> : null}
            <div className="list">
              {friends.map((f) => (
                <div key={f.friendId} className="listItem">
                  <div>
                    <span className="badge">{f.friendUserId}</span>
                  </div>
                  <small>
                    <Link to={`/profiles/${f.friendUserId}`}>View profile (route scaffold)</Link>
                  </small>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>Friends' ratings feed</h2>
            <p>
              Backed by <code>GET /ratings?friendOnly=true</code>.
            </p>
            <div className="grid">
              {feed
                .filter((r) => r.song)
                .map((r) => (
                  <SongCard
                    key={r.ratingId}
                    song={r.song}
                    to={`/songs/${r.songId}`}
                    rightSlot={<RatingPill value={r.ratingValue} />}
                    footerSlot={
                      <>
                        <div className="subtle">
                          {r.profile?.username ? `@${r.profile.username}` : ''}
                          {r.createdAt ? ` • ${new Date(r.createdAt).toLocaleDateString()}` : ''}
                        </div>
                        {r.review ? <div style={{ marginTop: 6 }}>{r.review}</div> : null}
                      </>
                    }
                  />
                ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  )
}
