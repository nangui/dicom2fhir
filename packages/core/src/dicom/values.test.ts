import { describe, expect, it } from 'vitest'
import { loadFixture } from '../../test/fixtures'
import { parseDicom } from './parse'
import { parseDA, parseIS, parsePN, readDate, readInt, readPersonName, readString } from './values'

describe('parseDA (DICOM date "YYYYMMDD" -> ISO "YYYY-MM-DD")', () => {
  it.each([
    ['20040119', '2004-01-19'],
    [' 20040119 ', '2004-01-19'], // padding
    ['2004.01.19', '2004-01-19'], // legacy ACR-NEMA format still found in old files
    ['20240229', '2024-02-29'], // leap year
    ['20000229', '2000-02-29'], // divisible by 400: leap
  ])('%j -> %s', (raw, iso) => {
    expect(parseDA(raw)).toBe(iso)
  })

  it.each<[string | undefined, string]>([
    ['20230229', 'not a leap year'],
    ['19000229', 'divisible by 100 but not 400'],
    ['20041301', 'month 13'],
    ['20040100', 'day 0'],
    ['20040431', 'April has 30 days'],
    ['00000000', 'all zeros'],
    ['2004-01-19', 'ISO is not a DICOM DA'],
    ['2004011', 'too short'],
    ['200401190', 'too long'],
    ['2004011a', 'non-digit'],
    ['20040101-20041231', 'a query range, not a value'],
    ['', 'empty'],
    [undefined, 'missing'],
  ])('rejects %j (%s)', (raw) => {
    expect(parseDA(raw)).toBeUndefined()
  })
})

describe('parsePN (DICOM person name "Family^Given^Middle^Prefix^Suffix")', () => {
  it.each([
    ['CompressedSamples^CT1', { family: 'CompressedSamples', given: 'CT1' }],
    ['Doe^John^Quincy^Dr^Jr', { family: 'Doe', given: 'John', middle: 'Quincy', prefix: 'Dr', suffix: 'Jr' }],
    ['Doe', { family: 'Doe' }],
    ['^John', { given: 'John' }],
    ['Doe^^^^', { family: 'Doe' }],
    [' Doe ^ John ', { family: 'Doe', given: 'John' }],
    // Component groups: alphabetic=ideographic=phonetic. Take the first non-empty one.
    ['Yamada^Tarou=山田^太郎=やまだ^たろう', { family: 'Yamada', given: 'Tarou' }],
    ['=山田^太郎', { family: '山田', given: '太郎' }],
  ])('%j', (raw, expected) => {
    expect(parsePN(raw)).toStrictEqual(expected)
  })

  it.each([[''], ['^^^^'], ['=='], ['  '], [undefined]])('returns undefined for %j', (raw) => {
    expect(parsePN(raw)).toBeUndefined()
  })
})

describe('parseIS (DICOM integer string)', () => {
  it.each([
    ['1', 1],
    [' 42 ', 42],
    ['+7', 7],
    ['-3', -3],
    ['007', 7],
    ['2147483647', 2147483647],
    ['1\\2', 1], // multi-valued: first value
  ])('%j -> %d', (raw, value) => {
    expect(parseIS(raw)).toBe(value)
  })

  it.each([[''], [undefined], ['1.5'], ['abc'], ['1e3'], ['12a'], ['+'], ['2147483648'], ['-2147483649']])(
    'rejects %j',
    (raw) => {
      expect(parseIS(raw)).toBeUndefined()
    },
  )
})

describe('readers on a parsed data set (CT_small.dcm)', () => {
  const parsed = parseDicom(loadFixture('CT_small.dcm'))
  if (!parsed.ok) throw new Error('fixture must parse')
  const ds = parsed.dataSet

  it('readString trims padding', () => {
    expect(readString(ds, 'x00080060')).toBe('CT')
  })

  it('readString returns undefined for a present but empty attribute and for an absent one', () => {
    expect(readString(ds, 'x00100030')).toBeUndefined() // PatientBirthDate, present and empty
    expect(readString(ds, 'x00181030')).toBeUndefined() // ProtocolName, absent
  })

  it('readDate reads StudyDate as ISO', () => {
    expect(readDate(ds, 'x00080020')).toBe('2004-01-19')
  })

  it('readPersonName reads PatientName', () => {
    expect(readPersonName(ds, 'x00100010')).toStrictEqual({ family: 'CompressedSamples', given: 'CT1' })
  })

  it('readInt reads SeriesNumber despite its padding', () => {
    expect(readInt(ds, 'x00200011')).toBe(1)
  })
})
