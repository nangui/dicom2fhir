import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { appRouter } from './router'

const FIXED_NOW = new Date('2026-01-02T03:04:05.000Z')
const caller = appRouter.createCaller({ now: () => FIXED_NOW })

describe('appRouter.ping', () => {
  it('answers with pong and the server time', async () => {
    await expect(caller.ping({ name: 'web' })).resolves.toEqual({
      message: 'pong web',
      time: '2026-01-02T03:04:05.000Z',
    })
  })

  it.each([[''], ['x'.repeat(51)]])('rejects name=%j with BAD_REQUEST', async (name) => {
    await expect(caller.ping({ name })).rejects.toMatchObject({
      constructor: TRPCError,
      code: 'BAD_REQUEST',
    })
  })
})
