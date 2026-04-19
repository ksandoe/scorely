const STORAGE_KEY = 'scorely.top5'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function getUserKey(userId) {
  return userId || 'anon'
}

export function getTop5(userId) {
  const all = readAll()
  const list = all[getUserKey(userId)]
  return Array.isArray(list) ? list : []
}

export function setTop5(userId, songIds) {
  const all = readAll()
  all[getUserKey(userId)] = Array.isArray(songIds) ? songIds.slice(0, 5) : []
  writeAll(all)
  return all[getUserKey(userId)]
}

export function isInTop5(userId, songId) {
  return getTop5(userId).includes(songId)
}

export function toggleTop5(userId, songId) {
  const current = getTop5(userId)
  if (current.includes(songId)) {
    return setTop5(
      userId,
      current.filter((id) => id !== songId)
    )
  }

  if (current.length >= 5) {
    return current
  }

  return setTop5(userId, [...current, songId])
}

export function moveTop5(userId, fromIndex, direction) {
  const list = getTop5(userId)
  const toIndex = fromIndex + direction
  if (toIndex < 0 || toIndex >= list.length) return list
  const next = list.slice()
  const tmp = next[fromIndex]
  next[fromIndex] = next[toIndex]
  next[toIndex] = tmp
  return setTop5(userId, next)
}
