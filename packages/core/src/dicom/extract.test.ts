import { describe, expect, it } from 'vitest'
import { type FixtureName, loadFixture } from '../../test/fixtures'
import type { DataSet } from './dicom-parser'
import { extractInstance } from './extract'
import { parseDicom } from './parse'
import { TAG } from './tags'

function dataSetOf(name: FixtureName): DataSet {
  const parsed = parseDicom(loadFixture(name))
  if (!parsed.ok) throw new Error(`fixture ${name} must parse`)
  return parsed.dataSet
}

/** Minimal stand-in for attributes no fixture has (e.g. BurnedInAnnotation). */
function fakeDataSet(strings: Record<string, string>): DataSet {
  return { string: (tag: string) => strings[tag], uint16: () => undefined } as unknown as DataSet
}

const UIDS = {
  [TAG.StudyInstanceUID]: '1.2.3',
  [TAG.SeriesInstanceUID]: '1.2.3.4',
  [TAG.SOPInstanceUID]: '1.2.3.4.5',
}

describe('extractInstance', () => {
  it('extracts the dashboard metadata of CT_small.dcm', () => {
    expect(extractInstance(dataSetOf('CT_small.dcm'))).toStrictEqual({
      ok: true,
      instance: {
        studyInstanceUid: '1.3.6.1.4.1.5962.1.2.1.20040119072730.12322',
        seriesInstanceUid: '1.3.6.1.4.1.5962.1.3.1.1.20040119072730.12322',
        sopInstanceUid: '1.3.6.1.4.1.5962.1.1.1.1.1.20040119072730.12322',
        sopClassUid: '1.2.840.10008.5.1.4.1.1.2', // CT Image Storage
        transferSyntaxUid: '1.2.840.10008.1.2.1',
        modality: 'CT',
        studyDate: '2004-01-19',
        seriesDate: '1997-04-30',
        seriesNumber: 1,
        instanceNumber: 1,
        rows: 128,
        columns: 128,
        manufacturer: 'GE MEDICAL SYSTEMS',
        burnedInAnnotation: 'UNKNOWN',
      },
    })
  })

  it('reads the same MR metadata from all three transfer syntaxes, binary values included', () => {
    const [explicitLE, implicitLE, explicitBE] = (
      ['MR_small.dcm', 'MR_small_implicit.dcm', 'MR_small_bigendian.dcm'] as const
    ).map((name) => {
      const result = extractInstance(dataSetOf(name))
      if (!result.ok) throw new Error(`${name} must extract`)
      const { transferSyntaxUid, ...rest } = result.instance
      return { transferSyntaxUid, rest }
    })

    expect(explicitLE?.rest.rows).toBe(64) // US (binary): endianness matters here
    expect(implicitLE?.rest).toStrictEqual(explicitLE?.rest)
    expect(explicitBE?.rest).toStrictEqual(explicitLE?.rest)
    expect([explicitLE, implicitLE, explicitBE].map((r) => r?.transferSyntaxUid)).toEqual([
      '1.2.840.10008.1.2.1',
      '1.2.840.10008.1.2',
      '1.2.840.10008.1.2.2',
    ])
  })

  it('omits attributes that are present but empty (MR SeriesDate)', () => {
    const result = extractInstance(dataSetOf('MR_small.dcm'))

    expect(result.ok && result.instance).not.toHaveProperty('seriesDate')
  })

  it('never carries identifying attributes (no patient name, IDs or birth date)', () => {
    const json = JSON.stringify(extractInstance(dataSetOf('CT_small.dcm')))

    expect(json).not.toContain('CompressedSamples')
    expect(json).not.toMatch(/patient|accession|birth/i)
  })

  describe('burnedInAnnotation (0028,0301)', () => {
    it.each([
      ['YES', 'YES'],
      ['NO', 'NO'],
      [' yes ', 'YES'],
      ['MAYBE', 'UNKNOWN'],
      ['', 'UNKNOWN'],
    ] as const)('%j -> %s', (raw, expected) => {
      const result = extractInstance(fakeDataSet({ ...UIDS, [TAG.BurnedInAnnotation]: raw }))

      expect(result.ok && result.instance.burnedInAnnotation).toBe(expected)
    })

    it('is UNKNOWN when absent: a header audit cannot prove pixels are clean', () => {
      const result = extractInstance(fakeDataSet(UIDS))

      expect(result.ok && result.instance.burnedInAnnotation).toBe('UNKNOWN')
    })
  })

  describe('required UIDs', () => {
    it('reports every missing UID, in hierarchy order', () => {
      expect(extractInstance(fakeDataSet({ [TAG.SeriesInstanceUID]: '1.2' }))).toStrictEqual({
        ok: false,
        error: { kind: 'missing-uid', missing: ['StudyInstanceUID', 'SOPInstanceUID'] },
      })
    })

    it('treats a blank UID as missing', () => {
      const result = extractInstance(fakeDataSet({ ...UIDS, [TAG.SOPInstanceUID]: '   ' }))

      expect(result).toMatchObject({ ok: false, error: { missing: ['SOPInstanceUID'] } })
    })
  })
})
