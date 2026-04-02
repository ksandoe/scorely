import { createClient } from '@supabase/supabase-js'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export function getSupabaseAnon() {
  const url = requireEnv('SUPABASE_URL')
  const anonKey = requireEnv('SUPABASE_PUBLISHABLE_KEY')
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export function getSupabaseAdmin() {
  const url = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SECRET_KEY')
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export function getSupabaseForJwt(jwt) {
  const url = requireEnv('SUPABASE_URL')
  const anonKey = requireEnv('SUPABASE_PUBLISHABLE_KEY')
  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    },
    auth: { persistSession: false, autoRefreshToken: false }
  })
}
