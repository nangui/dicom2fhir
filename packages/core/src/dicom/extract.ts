import type { DataSet } from './dicom-parser'
import { TAG } from './tags'
import { readDate, readInt, readString } from './values'

/**
 * Per-instance metadata for the dataset dashboard. Built from an explicit list of
 * tags (allowlist by construction): no patient name, ID, birth date or accession
 * number is ever read here. Dates are still identifiers under Safe Harbor, so this
 * stays in the browser; the server payload is filtered again later (M6, M7).
 */
export interface InstanceMetadata {
  studyInstanceUid: string
  seriesInstanceUid: string
  sopInstanceUid: string
  sopClassUid?: string
  transferSyntaxUid?: string
  modality?: string
  /** ISO "YYYY-MM-DD" */
  studyDate?: string
  /** ISO "YYYY-MM-DD" */
  seriesDate?: string
  seriesNumber?: number
  instanceNumber?: number
  rows?: number
  columns?: number
  manufacturer?: string
  /** UNKNOWN when absent or unreadable: only YES or NO are actual answers. */
  burnedInAnnotation: BurnedInAnnotation
}

export type BurnedInAnnotation = 'YES' | 'NO' | 'UNKNOWN'

export type UidName = 'StudyInstanceUID' | 'SeriesInstanceUID' | 'SOPInstanceUID'

export type InstanceResult =
  | { ok: true; instance: InstanceMetadata }
  | { ok: false; error: { kind: 'missing-uid'; missing: UidName[] } }

// Hierarchy order: Study > Series > Instance.
const REQUIRED_UIDS: readonly UidName[] = ['StudyInstanceUID', 'SeriesInstanceUID', 'SOPInstanceUID']

/** An instance without its three UIDs cannot be placed in the study/series tree. */
export function extractInstance(dataSet: DataSet): InstanceResult {
  const uids: Record<UidName, string | undefined> = {
    StudyInstanceUID: readString(dataSet, TAG.StudyInstanceUID),
    SeriesInstanceUID: readString(dataSet, TAG.SeriesInstanceUID),
    SOPInstanceUID: readString(dataSet, TAG.SOPInstanceUID),
  }
  const missing = REQUIRED_UIDS.filter((name) => uids[name] === undefined)
  if (missing.length > 0 || !uids.StudyInstanceUID || !uids.SeriesInstanceUID || !uids.SOPInstanceUID) {
    return { ok: false, error: { kind: 'missing-uid', missing } }
  }

  const instance: InstanceMetadata = withoutUndefined({
    studyInstanceUid: uids.StudyInstanceUID,
    seriesInstanceUid: uids.SeriesInstanceUID,
    sopInstanceUid: uids.SOPInstanceUID,
    sopClassUid: readString(dataSet, TAG.SOPClassUID),
    transferSyntaxUid: readString(dataSet, TAG.TransferSyntaxUID),
    modality: readString(dataSet, TAG.Modality),
    studyDate: readDate(dataSet, TAG.StudyDate),
    seriesDate: readDate(dataSet, TAG.SeriesDate),
    seriesNumber: readInt(dataSet, TAG.SeriesNumber),
    instanceNumber: readInt(dataSet, TAG.InstanceNumber),
    // US (binary) values: dicom-parser applies the transfer syntax's endianness.
    rows: dataSet.uint16(TAG.Rows),
    columns: dataSet.uint16(TAG.Columns),
    manufacturer: readString(dataSet, TAG.Manufacturer),
    burnedInAnnotation: toBurnedInAnnotation(readString(dataSet, TAG.BurnedInAnnotation)),
  })
  return { ok: true, instance }
}

function toBurnedInAnnotation(raw: string | undefined): BurnedInAnnotation {
  const value = raw?.toUpperCase()
  return value === 'YES' || value === 'NO' ? value : 'UNKNOWN'
}

/** Drops undefined values so absent attributes are absent keys, not `key: undefined`. */
function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}
