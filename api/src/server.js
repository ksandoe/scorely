import 'dotenv/config'
import cors from 'cors'
import express from 'express'

const app = express()

app.use(express.json())
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true
  })
)

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

const port = Number(process.env.PORT) || 8787
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`)
})
