import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { v1Router } from './routes/v1.js'

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

const port = Number(process.env.PORT) || 8787
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`)
})
