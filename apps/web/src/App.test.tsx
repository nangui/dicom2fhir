import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the app name as the main heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'DICOM2FHIR Explorer' })).toBeInTheDocument()
  })

  it('tells the user that files stay in the browser', () => {
    render(<App />)
    expect(screen.getByText(/never leave your browser/i)).toBeInTheDocument()
  })
})
