import { describe, expect, it } from 'vitest'
import { loadConfig } from './config'

describe('loadConfig', () => {
  it('defaults PORT to 3001 when unset', () => {
    expect(loadConfig({}).port).toBe(3001)
  })

  it('treats an empty PORT as unset (compose `${PORT}` with no value)', () => {
    expect(loadConfig({ PORT: '' }).port).toBe(3001)
  })

  it('parses a valid PORT', () => {
    expect(loadConfig({ PORT: '8080' }).port).toBe(8080)
  })

  it.each(['abc', '0', '70000', '3.5', '-1'])('rejects PORT=%s with a message naming the variable', (value) => {
    expect(() => loadConfig({ PORT: value })).toThrow(/PORT/)
  })
})
