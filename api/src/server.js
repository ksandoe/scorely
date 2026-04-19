import 'dotenv/config'

import { app } from './app.js'

const port = Number(process.env.PORT) || 8787

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`)
  })
}
