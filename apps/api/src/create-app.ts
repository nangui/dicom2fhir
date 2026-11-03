import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { appRouter } from './trpc/router'

export interface AppDeps {
  version: string
  now: () => Date
  logger: Pick<Console, 'error'>
}

/** Builds the HTTP app. No I/O here: deps are injected so tests use app.request(). */
export function createApp(deps: AppDeps) {
  const app = new Hono().basePath('/api')

  app.get('/health', (c) => {
    c.header('Cache-Control', 'no-store')
    return c.json({
      status: 'ok',
      version: deps.version,
      time: deps.now().toISOString(),
    })
  })

  // basePath already adds /api to the route, but tRPC needs the full public path.
  app.use(
    '/trpc/*',
    trpcServer({
      endpoint: '/api/trpc',
      router: appRouter,
      createContext: () => ({ now: deps.now }),
      onError: ({ error }) => {
        if (error.code === 'INTERNAL_SERVER_ERROR') deps.logger.error(error)
      },
    }),
  )

  app.notFound((c)=> c.json({ error: 'Not found' }, 404))

  // Same JSON contract as 404. Never echo err.message: it could carry metadata.
  app.onError((err, c) => {
    deps.logger.error(err)
    return c.json({ error: 'Internal error' }, 500)
  })

  return app
}
