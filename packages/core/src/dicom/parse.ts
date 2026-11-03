import { type DataSet, dicomParser } from './dicom-parser'

export type ParseErrorKind = 'not-dicom' | 'truncated' | 'invalid'

export type ParseResult =
  | { ok: true; dataSet: DataSet }
  | { ok: false; error: { kind: ParseErrorKind; message: string } }

// Part 10 layout: 128-byte preamble, then the magic "DICM".
const PREAMBLE_LENGTH = 128
const MAGIC = [0x44, 0x49, 0x43, 0x4d] // "DICM"

/**
 * Parses a DICOM Part 10 file. Never throws: every failure becomes a typed result.
 * On failure no partial data set is returned (fail closed): auditing half a header
 * could miss identifying data.
 */
export function parseDicom(bytes: Uint8Array): ParseResult {
  if (!hasMagic(bytes)) {
    return failure('not-dicom', 'No "DICM" magic after the 128-byte preamble')
  }
  try {
    return { ok: true, dataSet: dicomParser.parseDicom(bytes) }
  } catch (thrown) {
    const message = toMessage(thrown)
    return failure(classify(message), message)
  }
}

function hasMagic(bytes: Uint8Array): boolean {
  if (bytes.length < PREAMBLE_LENGTH + MAGIC.length) return false
  return MAGIC.every((byte, i) => bytes[PREAMBLE_LENGTH + i] === byte)
}

/** dicom-parser throws strings, `{ exception, dataSet }` objects or Errors. */
function toMessage(thrown: unknown): string {
  if (typeof thrown === 'string') return thrown
  if (thrown instanceof Error) return thrown.message
  if (typeof thrown === 'object' && thrown !== null && 'exception' in thrown) {
    return toMessage(thrown.exception)
  }
  return 'Unknown DICOM parse error'
}

function classify(message: string): ParseErrorKind {
  return /past end of buffer|buffer overrun/i.test(message) ? 'truncated' : 'invalid'
}

function failure(kind: ParseErrorKind, message: string): ParseResult {
  return { ok: false, error: { kind, message: message || 'Unknown DICOM parse error' } }
}
