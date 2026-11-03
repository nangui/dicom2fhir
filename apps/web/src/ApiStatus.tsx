import { useQuery } from '@tanstack/react-query'
import { useTRPC } from './trpc'

export function ApiStatus() {
  const trpc = useTRPC()
  const ping = useQuery(trpc.ping.queryOptions({ name: 'web' }))

  let text: string
  if (ping.isPending) text = 'Checking API…'
  else if (ping.isError) text = 'API unreachable'
  else text = `API: ${ping.data.message}`

  return <p role="status">{text}</p>
}
