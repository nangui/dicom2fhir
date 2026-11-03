import type { AppRouter } from '@dicom2fhir/api/trpc'
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

export interface ApiClientOptions {
  url?: string
  /** Injected in tests to run the api app in-process. */
  fetch?: typeof globalThis.fetch
}

export function createApiClient({ url = '/api/trpc', fetch }: ApiClientOptions = {}) {
  return createTRPCClient<AppRouter>({
    // Stream link: the M7 agent run streams events back over a POST body.
    links: [httpBatchStreamLink({ url, fetch })],
  })
}
