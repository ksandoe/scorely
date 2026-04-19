const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/v1' : null)

export function getApiBaseUrl() {
  return API_BASE_URL || ''
}

export async function apiFetch(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured for this build')
  }

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')

  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body
  })

  if (res.status === 204) return null

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = data?.message || `Request failed: ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.payload = data
    throw error
  }

  return data
}

export function authHeaders(token) {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}
