import { z } from 'zod'
import { publicProcedure, router } from './init'

export const appRouter = router({
  ping: publicProcedure
    .input(z.object({ name: z.string().min(1).max(50) }))
    .query(({ input, ctx }) => ({
      message: `pong ${input.name}`,
      time: ctx.now().toISOString(),
    })),
})

/** The only thing the web app may import from api, and only as a type. */
export type AppRouter = typeof appRouter
