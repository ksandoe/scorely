import serverless from 'serverless-http'

let coldStartInitialized = false

async function loadSecretsOnce() {
  if (coldStartInitialized) return
  coldStartInitialized = true

  if (process.env.IS_OFFLINE) {
    try {
      await import('dotenv/config')
    } catch {
      // ignore
    }
    return
  }

  const secretId = process.env.SECRETS_ID
  if (!secretId) return

  try {
    const { SecretsManagerClient, GetSecretValueCommand } = await import(
      '@aws-sdk/client-secrets-manager'
    )

    const client = new SecretsManagerClient({})
    const result = await client.send(new GetSecretValueCommand({ SecretId: secretId }))

    const raw = result?.SecretString
    if (!raw) return

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }

    if (!parsed || typeof parsed !== 'object') return

    for (const [key, value] of Object.entries(parsed)) {
      if (value === undefined || value === null) continue
      if (process.env[key]) continue
      process.env[key] = typeof value === 'string' ? value : String(value)
    }
  } catch {
    // Never throw on cold start
  }
}

export const handler = async (event, context) => {
  await loadSecretsOnce()

  const { app } = await import('./app.js')
  const wrapped = serverless(app)

  return wrapped(event, context)
}
