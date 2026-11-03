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

  describe('VALIDATOR_URL', () => {
    it('defaults to the public HAPI R4 server (dev on a small machine)', () => {
      expect(loadConfig({}).validatorUrl).toBe('https://hapi.fhir.org/baseR4')
    })

    it('treats an empty value as unset', () => {
      expect(loadConfig({ VALIDATOR_URL: '' }).validatorUrl).toBe('https://hapi.fhir.org/baseR4')
    })

    it('accepts a local HAPI (compose profile or CI)', () => {
      expect(loadConfig({ VALIDATOR_URL: 'http://hapi:8080/fhir' }).validatorUrl).toBe('http://hapi:8080/fhir')
    })

    it('drops a trailing slash so paths can be appended safely', () => {
      expect(loadConfig({ VALIDATOR_URL: 'http://localhost:8080/fhir/' }).validatorUrl).toBe('http://localhost:8080/fhir')
    })

    it.each(['not a url', 'ftp://hapi/fhir', 'file:///etc/passwd'])('rejects %s', (value) => {
      expect(() => loadConfig({ VALIDATOR_URL: value })).toThrow(/VALIDATOR_URL/)
    })
  })
})
