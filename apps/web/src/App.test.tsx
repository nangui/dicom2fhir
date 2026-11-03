import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { renderWithApi } from './test/render'

describe('App', () => {
  it('renders the title and the privacy promise', () => {
    renderWithApi(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'DICOM2FHIR Explorer' })).toBeInTheDocument()
    expect(screen.getByText(/never leave your browser/i)).toBeInTheDocument()
  })

  it('shows the api status', async () => {
    renderWithApi(<App />)

    expect(await screen.findByText('API: pong web')).toBeInTheDocument()
  })
})
