import { describe, expect, it } from 'vitest'
import { FIXTURES, loadFixture } from '../../test/fixtures'
import { parseDicom } from './parse'

describe('parseDicom', () => {
  it.each([
    ['CT_small.dcm', 'CT', '1.2.840.10008.1.2.1'],
    ['MR_small.dcm', 'MR', '1.2.840.10008.1.2.1'],
    ['MR_small_implicit.dcm', 'MR', '1.2.840.10008.1.2'],
    ['MR_small_bigendian.dcm', 'MR', '1.2.840.10008.1.2.2'],
  ] as const)('parses %s (modality %s, transfer syntax %s)', (name, modality, transferSyntax) => {
    const result = parseDicom(loadFixture(name))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.dataSet.string('x00080060')).toBe(modality)
    expect(result.dataSet.string('x00020010')).toBe(transferSyntax)
  })

  describe('not-dicom: too short or no "DICM" magic', () => {
    it.each([
      ['an empty file', new Uint8Array(0)],
      ['a file shorter than preamble + magic', new Uint8Array(131)],
      ['300 bytes of garbage', new Uint8Array(300).fill(7)],
      ['a PNG signature', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(200).fill(0)])],
    ])('rejects %s', (_label, bytes) => {
      expect(parseDicom(bytes)).toMatchObject({ ok: false, error: { kind: 'not-dicom' } })
    })
  })

  it('reports truncated when the data set is cut mid-element', () => {
    const ct = loadFixture('CT_small.dcm')

    expect(parseDicom(ct.subarray(0, ct.length / 2))).toMatchObject({ ok: false, error: { kind: 'truncated' } })
  })

  it('reports invalid when the file meta header is incomplete', () => {
    const ct = loadFixture('CT_small.dcm')

    expect(parseDicom(ct.subarray(0, 140))).toMatchObject({ ok: false, error: { kind: 'invalid' } })
  })

  it('fails closed: no partial data set is returned on error', () => {
    const ct = loadFixture('CT_small.dcm')
    const result = parseDicom(ct.subarray(0, ct.length / 2))

    expect(result).not.toHaveProperty('dataSet')
  })

  it('always returns a readable string message, whatever the parser threw', () => {
    const ct = loadFixture('CT_small.dcm')
    const failures = [new Uint8Array(0), new Uint8Array(300), ct.subarray(0, 140), ct.subarray(0, 5000)]

    for (const bytes of failures) {
      const result = parseDicom(bytes)
      expect(result.ok).toBe(false)
      if (result.ok) continue
      expect(typeof result.error.message).toBe('string')
      expect(result.error.message.length).toBeGreaterThan(0)
    }
  })

  it('never throws, even on random bytes behind a valid "DICM" magic', () => {
    let seed = 42
    const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) % 256

    for (let run = 0; run < 200; run++) {
      const bytes = Uint8Array.from({ length: 132 + (run % 64) * 8 }, random)
      bytes.set([0x44, 0x49, 0x43, 0x4d], 128) // "DICM"
      expect(() => parseDicom(bytes)).not.toThrow()
    }
  })

  it('does not modify the input bytes', () => {
    for (const name of FIXTURES) {
      const bytes = loadFixture(name)
      const copy = bytes.slice()
      parseDicom(bytes)
      expect(bytes).toEqual(copy)
    }
  })
})
