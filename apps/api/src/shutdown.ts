export interface ClosableServer {
  close(callback?: (err?: Error) => void): unknown
  closeAllConnections?(): void
}

export interface ShutdownOptions {
  timeoutMs: number
  exit: (code: number) => void
  log: (message: string) => void
}

/**
 * Returns a signal handler: stop accepting connections, let in-flight requests
 * finish, and force-close after timeoutMs (Docker sends SIGKILL after 10 s).
 */
export function createShutdown(server: ClosableServer, { timeoutMs, exit, log }: ShutdownOptions) {
  let shuttingDown = false

  return (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    log(`${signal} received, closing server`)

    const forceTimer = setTimeout(() => {
      log(`still busy after ${timeoutMs} ms, forcing connections closed`)
      server.closeAllConnections?.()
      exit(1)
    }, timeoutMs)
    forceTimer.unref()

    server.close((err) => {
      clearTimeout(forceTimer)
      exit(err ? 1 : 0)
    })
  }
}
