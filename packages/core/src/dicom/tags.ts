const MAX_UINT16 = 0xffff

function toHex4(value: number, name: string): string {
  if (!Number.isInteger(value) || value < 0 || value > MAX_UINT16) {
    throw new RangeError(`${name} must be an integer between 0x0000 and 0xFFFF, got ${value}`)
  }
  return value.toString(16).padStart(4, '0')
}

/** dicom-parser key of a data element, e.g. (0010,0010) -> 'x00100010'. */
export function toTagKey(group: number, element: number): string {
  return `x${toHex4(group, 'group')}${toHex4(element, 'element')}`
}

/** Data elements read by core, as dicom-parser keys. Reading only listed tags is the allowlist. */
export const TAG = {
  TransferSyntaxUID: toTagKey(0x0002, 0x0010),
  SOPClassUID: toTagKey(0x0008, 0x0016),
  SOPInstanceUID: toTagKey(0x0008, 0x0018),
  StudyDate: toTagKey(0x0008, 0x0020),
  SeriesDate: toTagKey(0x0008, 0x0021),
  Modality: toTagKey(0x0008, 0x0060),
  Manufacturer: toTagKey(0x0008, 0x0070),
  StudyInstanceUID: toTagKey(0x0020, 0x000d),
  SeriesInstanceUID: toTagKey(0x0020, 0x000e),
  SeriesNumber: toTagKey(0x0020, 0x0011),
  InstanceNumber: toTagKey(0x0020, 0x0013),
  Rows: toTagKey(0x0028, 0x0010),
  Columns: toTagKey(0x0028, 0x0011),
  BurnedInAnnotation: toTagKey(0x0028, 0x0301),
} as const
