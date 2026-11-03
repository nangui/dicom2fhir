import { serve } from '@hono/node-server'
import pkg from '../package.json' with { type: 'json' }
import { loadConfig } from './config'
import { createApp } from './create-app'
import { createShutdown } from './shutdown'

const config = loadConfig(process.env)
const app = createApp({ version: pkg.version, now: () => new Date(), logger: console })

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}/api/health`)
})

// Under Docker's 10 s grace period, so we exit before SIGKILL.
const shutdown = createShutdown(server, {
  timeoutMs: 8000,
  exit: (code) => process.exit(code),
  log: (message) => console.log(message),
})
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
