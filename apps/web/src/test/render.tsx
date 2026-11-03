import { createApp } from '@dicom2fhir/api/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { vi } from 'vitest'
import { createApiClient, TRPCProvider } from '../trpc'

export const FIXED_NOW = new Date('2026-01-02T03:04:05.000Z')

/** A fetch that runs the real Hono app in-process: web -> tRPC client -> api, no network. */
export function inProcessApiFetch(now: () => Date = () => FIXED_NOW): typeof fetch {
  const app = createApp({ version: '0.0.0-test', now, logger: { error: vi.fn() } })
  return (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    return Promise.resolve(app.fetch(new Request(new URL(url, 'http://localhost'), init)))
  }
}

export function renderWithApi(ui: ReactNode, fetch: typeof globalThis.fetch = inProcessApiFetch()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const trpcClient = createApiClient({ fetch })
  return render(
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {ui}
      </TRPCProvider>
    </QueryClientProvider>,
  )
}
