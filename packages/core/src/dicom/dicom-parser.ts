import * as namespace from 'dicom-parser'

export type { DataSet, Element } from 'dicom-parser'

type DicomParser = typeof namespace

/**
 * dicom-parser ships a CommonJS/UMD bundle. Bundlers (Vite, Vitest) expose its
 * named exports, but Node ESM and tsx only expose `default`, so a named import
 * crashes there. Normalize once; the rest of core imports from this module.
 */
export const dicomParser: DicomParser = (namespace as DicomParser & { default?: DicomParser }).default ?? namespace
