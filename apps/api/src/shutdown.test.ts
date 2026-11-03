import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createShutdown } from './shutdown'

function fakeServer() {
  let closeCallback: ((err?: Error) => void) | undefined
  return {
    close: vi.fn((cb?: (err?: Error) => void) => {
      closeCallback = cb
    }),
    closeAllConnections: vi.fn(),
    finishClose: (err?: Error) => closeCallback?.(err),
  }
}

describe('createShutdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function setup() {
    const server = fakeServer()
    const exit = vi.fn()
    const log = vi.fn()
    const shutdown = createShutdown(server, { timeoutMs: 8000, exit, log })
    return { server, exit, shutdown }
  }

  it('closes the server and exits 0 once in-flight requests finish', () => {
    const { server, exit, shutdown } = setup()

    shutdown('SIGTERM')
    expect(server.close).toHaveBeenCalledOnce()
    expect(exit).not.toHaveBeenCalled()

    server.finishClose()
    expect(exit).toHaveBeenCalledExactlyOnceWith(0)
  })

  it('exits 1 when close reports an error', () => {
    const { server, exit, shutdown } = setup()

    shutdown('SIGTERM')
    server.finishClose(new Error('not running'))

    expect(exit).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('forces connections closed and exits 1 after the timeout', () => {
    const { server, exit, shutdown } = setup()

    shutdown('SIGTERM')
    vi.advanceTimersByTime(7999)
    expect(exit).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(server.closeAllConnections).toHaveBeenCalledOnce()
    expect(exit).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('does not fire the timeout after a clean close', () => {
    const { server, exit, shutdown } = setup()

    shutdown('SIGTERM')
    server.finishClose()
    vi.advanceTimersByTime(10_000)

    expect(server.closeAllConnections).not.toHaveBeenCalled()
    expect(exit).toHaveBeenCalledExactlyOnceWith(0)
  })

  it('ignores a second signal while already shutting down', () => {
    const { server, shutdown } = setup()

    shutdown('SIGTERM')
    shutdown('SIGINT')

    expect(server.close).toHaveBeenCalledOnce()
  })
})
