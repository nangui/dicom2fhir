import { initTRPC } from '@trpc/server'

export interface TrpcContext {
  now: () => Date
}

const t = initTRPC.context<TrpcContext>().create({
  // Never send stack traces to the browser, whatever NODE_ENV says.
  isDev: false,
  // Same rule as Hono's onError: an internal message could carry metadata.
  errorFormatter: ({ shape, error }) =>
    error.code === 'INTERNAL_SERVER_ERROR' ? { ...shape, message: 'Internal error' } : shape,
})

export const router = t.router
export const publicProcedure = t.procedure
