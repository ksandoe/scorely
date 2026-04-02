import { getSupabaseForJwt } from '../lib/supabase.js'
import { sendError } from '../lib/http.js'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return sendError(res, 401, 'auth_error', 'Missing or invalid JWT')
  }

  const token = header.slice('bearer '.length).trim()
  if (!token) {
    return sendError(res, 401, 'auth_error', 'Missing or invalid JWT')
  }

  try {
    const supabase = getSupabaseForJwt(token)
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
      return sendError(res, 401, 'auth_error', 'Missing or invalid JWT')
    }

    req.auth = {
      jwt: token,
      userId: data.user.id
    }

    return next()
  } catch {
    return sendError(res, 401, 'auth_error', 'Missing or invalid JWT')
  }
}
