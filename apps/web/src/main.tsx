import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { createApiClient, TRPCProvider } from './trpc'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

// Module-level singletons: one cache and one client for the whole SPA.
const queryClient = new QueryClient()
const trpcClient = createApiClient()

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <App />
      </TRPCProvider>
    </QueryClientProvider>
  </StrictMode>,
)
