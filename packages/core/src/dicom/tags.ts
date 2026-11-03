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
