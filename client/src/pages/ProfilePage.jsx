import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchPublicTop5 } from '../lib/top5Remote'
import SongCard from '../components/SongCard.jsx'
import RatingPill from '../components/RatingPill.jsx'

export default function ProfilePage() {
  const { userId } = useParams()
  const { token, profile: me } = useAuth()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [top5, setTop5] = useState([])
  const [followRow, setFollowRow] = useState(null)

  const isMe = Boolean(me?.id) && me.id === userId

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

        const t = await fetchPublicTop5(userId)

        const r = await apiFetch(`/ratings?userId=${encodeURIComponent(userId)}&page=1&pageSize=50`, {
          headers: authHeaders(token)
        })

        const outgoing = await apiFetch('/friends?direction=outgoing&page=1&pageSize=200', {
          headers: authHeaders(token)
        })

        const existing = (outgoing.data || []).find((f) => f.friendUserId === userId) || null

        if (!cancelled) {
          setProfile(p)
          setTop5(t || [])
          setRatings(r.data || [])
          setFollowRow(existing)
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

      {busy ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <section>
        <h2>Profile</h2>
        {profile ? (
          <div className="listItem">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>@{profile.username}</div>
                <small>{profile.createdAt ? `Joined ${new Date(profile.createdAt).toLocaleDateString()}` : null}</small>
              </div>
              {!isMe ? (
                <button
                  type="button"
                  className={followRow ? 'danger' : 'primary'}
                  disabled={busy}
                  onClick={async () => {
                    if (!token || !profile?.username) return
                    setBusy(true)
                    setError('')
                    try {
                      if (followRow?.friendId) {
                        await apiFetch(`/friends/${followRow.friendId}`, {
                          method: 'DELETE',
                          headers: authHeaders(token)
                        })
                        setFollowRow(null)
                      } else {
                        const created = await apiFetch('/friends', {
                          method: 'POST',
                          headers: authHeaders(token),
                          json: { friendUsername: profile.username }
                        })
                        setFollowRow(created)
                      }
                    } catch (e) {
                      setError(e.message)
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  {followRow ? 'Unfollow' : 'Follow'}
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <p>—</p>
        )}
      </section>

      <section>
        <h2>Top 5</h2>
        <p className="subtle">Manually curated favorites.</p>
        {top5.length === 0 ? <p>No Top 5 selected yet.</p> : null}
        <div className="grid">
          {top5
            .filter((e) => e.song)
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((e) => (
              <SongCard key={e.top5Id} song={e.song} />
            ))}
        </div>
      </section>

      <section>
        <h2>Ratings</h2>
        <div className="grid">
          {ratings
            .filter((r) => r.song)
            .map((r) => (
              <SongCard
                key={r.ratingId}
                song={r.song}
                to={`/songs/${r.songId}`}
                rightSlot={<RatingPill value={r.ratingValue} />}
                footerSlot={
                  r.review ? (
                    <div style={{ marginTop: 6 }}>
                      <span className="subtle">Review:</span> {r.review}
                    </div>
                  ) : null
                }
              />
            ))}
        </div>
      </section>
    </main>
  )
}
