import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { FIXTURES, loadFixture, readManifest } from './fixtures'

describe('pydicom fixtures', () => {
  const manifest = readManifest()

  it('lists every fixture in the SHA-256 manifest', () => {
    expect(Object.keys(manifest).sort()).toEqual([...FIXTURES].sort())
  })

  it.each(FIXTURES)('%s matches its manifest checksum', (name) => {
    const digest = createHash('sha256').update(loadFixture(name)).digest('hex')

    expect(digest).toBe(manifest[name])
  })

  it.each(FIXTURES)('%s is a Part 10 file (128-byte preamble then "DICM")', (name) => {
    const bytes = loadFixture(name)
    const magic = new TextDecoder().decode(bytes.subarray(128, 132))

    expect(magic).toBe('DICM')
  })

  it('returns a fresh copy, so a test cannot corrupt another one', () => {
    const first = loadFixture('CT_small.dcm')
    first[0] = 0xff

    expect(loadFixture('CT_small.dcm')[0]).not.toBe(0xff)
  })
})
