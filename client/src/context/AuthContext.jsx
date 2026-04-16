import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, authHeaders } from '../lib/api'

const AuthContext = createContext(null)

const STORAGE_KEY = 'scorely.auth'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStored(value) {
  try {
    if (!value) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStored()?.token || null)
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    writeStored(token ? { token } : null)
  }, [token])

  async function refreshProfile(nextToken = token) {
    if (!nextToken) {
      setProfile(null)
      setStatus('idle')
      return null
    }

    setStatus('loading')
    const me = await apiFetch('/profiles/me', {
      headers: authHeaders(nextToken)
    })
    setProfile(me)
    setStatus('ready')
    return me
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!token) {
        setProfile(null)
        setStatus('idle')
        return
      }

      try {
        const me = await apiFetch('/profiles/me', {
          headers: authHeaders(token)
        })
        if (!cancelled) {
          setProfile(me)
          setStatus('ready')
        }
      } catch {
        if (!cancelled) {
          setProfile(null)
          setToken(null)
          setStatus('idle')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token])

  const value = useMemo(
    () => ({
      token,
      setToken,
      profile,
      setProfile,
      status,
      refreshProfile,
      logout() {
        setToken(null)
        setProfile(null)
      }
    }),
    [token, profile, status]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
