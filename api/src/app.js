import cors from 'cors'
import express from 'express'
import 'express-async-errors'
import { v1Router } from './routes/v1.js'

export function createApp() {
  const app = express()

  app.use(express.json())
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || true
    })
  )

  app.use('/v1', v1Router)

  app.use((req, res) => {
    res.status(404).json({ error: 'not_found', message: 'Route not found' })
  })

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    // eslint-disable-next-line no-console
    console.error(err)
    const message = err?.message || 'Internal Server Error'
    return res.status(500).json({ error: 'internal_error', message })
  })

  return app
}

export const app = createApp()
