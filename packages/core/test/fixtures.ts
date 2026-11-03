import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DIR = fileURLToPath(new URL('./fixtures/pydicom/', import.meta.url))

/** Small public DICOM files (NEMA WG04, downsized by pydicom). See fixtures/pydicom/SOURCES.md. */
export const FIXTURES = [
  'CT_small.dcm', // Explicit VR Little Endian
  'MR_small.dcm', // Explicit VR Little Endian
  'MR_small_implicit.dcm', // Implicit VR Little Endian
  'MR_small_bigendian.dcm', // Explicit VR Big Endian (retired syntax)
] as const

export type FixtureName = (typeof FIXTURES)[number]

/** Reads a fixture as bytes, the way the browser gets them from a File. */
export function loadFixture(name: FixtureName): Uint8Array {
  // readFileSync returns a new Buffer each time; expose it as a plain Uint8Array.
  const buffer = readFileSync(DIR + name)
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

/** Parses SHA256SUMS (`<hex>  <name>` per line, the shasum/sha256sum format). */
export function readManifest(): Record<string, string> {
  const entries = readFileSync(DIR + 'SHA256SUMS', 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [hash, name] = line.split(/\s+\*?/)
      if (!hash || !name) throw new Error(`Malformed SHA256SUMS line: ${line}`)
      return [name, hash] as const
    })
  return Object.fromEntries(entries)
}
