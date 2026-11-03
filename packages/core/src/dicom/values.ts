import type { DataSet } from './dicom-parser'

/** DICOM PN components, only the non-empty ones are present. */
export interface PersonName {
  family?: string
  given?: string
  middle?: string
  prefix?: string
  suffix?: string
}

// "YYYYMMDD", or the legacy ACR-NEMA "YYYY.MM.DD". `\2` makes the dots all-or-none.
const DA_PATTERN = /^(\d{4})(\.?)(\d{2})\2(\d{2})$/
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const INT32_MIN = -(2 ** 31)
const INT32_MAX = 2 ** 31 - 1

/** DICOM DA to ISO "YYYY-MM-DD", or undefined if it is not a real calendar date. */
export function parseDA(raw: string | undefined): string | undefined {
  const match = DA_PATTERN.exec(raw?.trim() ?? '')
  if (!match) return undefined
  const [, yyyy = '', , mm = '', dd = ''] = match
  const year = Number(yyyy)
  const month = Number(mm)
  const day = Number(dd)
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return undefined
  }
  return `${yyyy}-${mm}-${dd}`
}

// Computed by hand: Date.UTC maps years 0..99 to 1900..1999.
function daysInMonth(year: number, month: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  return month === 2 && isLeap ? 29 : (DAYS_IN_MONTH[month - 1] ?? 0)
}

/**
 * DICOM PN "Family^Given^Middle^Prefix^Suffix". A name may have up to three
 * component groups (alphabetic=ideographic=phonetic); the first non-empty one wins.
 * Multi-valued names (separated by "\") keep the first value.
 */
export function parsePN(raw: string | undefined): PersonName | undefined {
  const firstValue = raw?.split('\\')[0] ?? ''
  const group = firstValue.split('=').find((g) => g.replace(/\^/g, '').trim() !== '')
  if (group === undefined) return undefined

  const [family, given, middle, prefix, suffix] = group.split('^').map((part) => part.trim())
  const name: PersonName = {}
  if (family) name.family = family
  if (given) name.given = given
  if (middle) name.middle = middle
  if (prefix) name.prefix = prefix
  if (suffix) name.suffix = suffix
  return name
}

/** DICOM IS (integer string, signed 32-bit). Multi-valued strings keep the first value. */
export function parseIS(raw: string | undefined): number | undefined {
  const first = (raw?.split('\\')[0] ?? '').trim()
  if (!/^[+-]?\d+$/.test(first)) return undefined
  const value = Number(first)
  return value >= INT32_MIN && value <= INT32_MAX ? value : undefined
}

/** Trimmed string value; undefined when the attribute is absent or empty. */
export function readString(dataSet: DataSet, tag: string): string | undefined {
  const value = dataSet.string(tag)?.trim()
  return value ? value : undefined
}

export function readDate(dataSet: DataSet, tag: string): string | undefined {
  return parseDA(dataSet.string(tag))
}

export function readPersonName(dataSet: DataSet, tag: string): PersonName | undefined {
  return parsePN(dataSet.string(tag))
}

export function readInt(dataSet: DataSet, tag: string): number | undefined {
  return parseIS(dataSet.string(tag))
}
