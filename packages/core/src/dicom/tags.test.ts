import { describe, expect, it } from 'vitest'
import { toTagKey } from './tags'

// dicom-parser indexes elements by keys like 'x00100010' (PatientName).
describe('toTagKey', () => {
  it('formats group and element as a dicom-parser key', () => {
    expect(toTagKey(0x0010, 0x0010)).toBe('x00100010')
  })

  it('pads each part to 4 hex digits', () => {
    expect(toTagKey(0x0008, 0x0060)).toBe('x00080060')
    expect(toTagKey(0x0000, 0x0000)).toBe('x00000000')
  })

  it('uses lowercase hex', () => {
    expect(toTagKey(0x7fe0, 0x0010)).toBe('x7fe00010')
    expect(toTagKey(0x0028, 0x0301)).toBe('x00280301')
  })

  it('accepts the 16-bit maximum', () => {
    expect(toTagKey(0xffff, 0xffff)).toBe('xffffffff')
  })

  it.each([
    [0x10000, 0x0000],
    [0x0000, 0x10000],
    [-1, 0x0010],
    [0x0010, -1],
    [1.5, 0x0010],
    [Number.NaN, 0x0010]
  ])('throws a RangeError for group %s, element %s', (group, element) => {
    expect(() => toTagKey(group, element)).toThrow(RangeError)
  })
})
