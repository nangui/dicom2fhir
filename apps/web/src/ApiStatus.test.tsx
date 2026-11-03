import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiStatus } from './ApiStatus'
import { renderWithApi } from './test/render'

describe('ApiStatus', () => {
  it('shows a checking state first', () => {
    renderWithApi(<ApiStatus />)

    expect(screen.getByRole('status')).toHaveTextContent(/checking api/i)
  })

  it('shows the pong from the real api app (in-process)', async () => {
    renderWithApi(<ApiStatus />)

    expect(await screen.findByText('API: pong web')).toBeInTheDocument()
  })

  it('shows unreachable when the network fails', async () => {
    const failingFetch: typeof fetch = () => Promise.reject(new TypeError('Failed to fetch'))
    renderWithApi(<ApiStatus />, failingFetch)

    expect(await screen.findByText('API unreachable')).toBeInTheDocument()
  })
})
