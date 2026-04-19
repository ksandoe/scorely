import { apiFetch, authHeaders } from './api'

export async function fetchPublicTop5(userId) {
  if (!userId) return []
  const res = await apiFetch(`/profiles/${encodeURIComponent(userId)}/top5`)
  return res.data || []
}

export async function fetchMyTop5(token, userId) {
  if (!token || !userId) return []
  return fetchPublicTop5(userId)
}

export async function updateMyTop5(token, songIds) {
  if (!token) throw new Error('Not signed in')
  const res = await apiFetch('/profiles/me/top5', {
    method: 'PUT',
    headers: authHeaders(token),
    json: { songIds }
  })
  return res.data || []
}
