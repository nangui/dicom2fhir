import { describe, expect, it, vi } from 'vitest'
import { type AppDeps, createApp } from './create-app'

const FIXED_NOW = new Date('2026-01-02T03:04:05.000Z')

function makeApp(overrides: Partial<AppDeps> = {}) {
  return createApp({
    version: '0.0.0-test',
    now: () => FIXED_NOW,
    logger: { error: vi.fn() },
    ...overrides,
  })
}

describe('createApp', () => {
  describe('GET /api/health', () => {
    it('returns 200 with status, version and time', async () => {
      const res = await makeApp().request('/api/health')

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toMatch(/application\/json/)
      expect(await res.json()).toEqual({
        status: 'ok',
        version: '0.0.0-test',
        time: '2026-01-02T03:04:05.000Z',
      })
    })

    it('does not cache the response', async () => {
      const res = await makeApp().request('/api/health')

      expect(res.headers.get('cache-control')).toBe('no-store')
    })
  })

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await makeApp().request('/api/nope')

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  it('returns a JSON 500 without leaking the error message, and logs it', async () => {
    const logger = { error: vi.fn() }
    const app = makeApp({
      logger,
      now: () => {
        throw new Error('PatientName=DOE^JOHN')
      },
    })

    const res = await app.request('/api/health')
    const body = await res.text()

    expect(res.status).toBe(500)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
    expect(JSON.parse(body)).toEqual({ error: 'Internal error' })
    expect(body).not.toContain('DOE')
    expect(logger.error).toHaveBeenCalledOnce()
  })

  describe('tRPC under /api/trpc', () => {
    const input = (value: unknown) => encodeURIComponent(JSON.stringify(value))

    it('serves the ping query', async () => {
      const res = await makeApp().request(`/api/trpc/ping?input=${input({ name: 'web' })}`)

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({
        result: { data: { message: 'pong web', time: '2026-01-02T03:04:05.000Z' } },
      })
    })

    it('returns 400 BAD_REQUEST for invalid input', async () => {
      const res = await makeApp().request(`/api/trpc/ping?input=${input({ name: '' })}`)

      expect(res.status).toBe(400)
      expect(await res.json()).toMatchObject({ error: { data: { code: 'BAD_REQUEST' } } })
    })

    it('returns 404 NOT_FOUND for an unknown procedure', async () => {
      const res = await makeApp().request('/api/trpc/nope')

      expect(res.status).toBe(404)
      expect(await res.json()).toMatchObject({ error: { data: { code: 'NOT_FOUND' } } })
    })

    it('masks internal error messages and stacks, and logs them', async () => {
      const logger = { error: vi.fn() }
      const app = makeApp({
        logger,
        now: () => {
          throw new Error('PatientName=DOE^JOHN')
        },
      })

      const res = await app.request(`/api/trpc/ping?input=${input({ name: 'web' })}`)
      const body = await res.text()

      expect(res.status).toBe(500)
      expect(body).not.toContain('DOE')
      expect(body).not.toContain('at ')
      expect(JSON.parse(body)).toMatchObject({
        error: { message: 'Internal error', data: { code: 'INTERNAL_SERVER_ERROR' } },
      })
      expect(logger.error).toHaveBeenCalledOnce()
    })
  })

  it('only serves routes under /api', async () => {
    const res = await makeApp().request('/health')

    expect(res.status).toBe(404)
  })
})
