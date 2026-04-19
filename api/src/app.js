import cors from 'cors'
import express from 'express'
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

  return app
}

export const app = createApp()
