import { toTagKey } from '@dicom2fhir/core'
import { describe, expect, it } from 'vitest'

// Guards the monorepo wiring: the web app consumes the core package from source.
describe('@dicom2fhir/core', () => {
  it('is importable from the web app', () => {
    expect(toTagKey(0x0010, 0x0010)).toBe('x00100010')
  })
})
