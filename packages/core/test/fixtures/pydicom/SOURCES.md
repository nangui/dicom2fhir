# pydicom test fixtures

Committed on purpose: they are tiny (68 KB in total) and keep tests deterministic and offline.
Re-fetch and verify with `scripts/fetch-fixtures.sh`.

- **Origin:** NEMA WG04 public sample datasets (`ftp://medical.nema.org/MEDICAL/Dicom/DataSets/WG04/`), downsized by the pydicom project.
- **Distributed by:** [pydicom](https://github.com/pydicom/pydicom) at commit `db6c2f5775c0b8fa8b87c0303ee6fa7d7bffc5c6`, path `src/pydicom/data/test_files/`. Provenance is described in that folder's `README.txt`.
- **License:** pydicom's `LICENSE` (MIT, with noted exceptions for parts derived from GDCM's private dictionary, which do not cover these files).
- **Content:** synthetic sample patients (for example `CompressedSamples^CT1`), not real people.

| File | Size | Transfer syntax | Derived from |
| --- | --- | --- | --- |
| `CT_small.dcm` | 39,206 B | Explicit VR Little Endian | NEMA `CT1_UNC`, downsized to 128x128 |
| `MR_small.dcm` | 9,830 B | Explicit VR Little Endian | NEMA `MR1_UNC`, downsized to 64x64 |
| `MR_small_implicit.dcm` | 9,702 B | Implicit VR Little Endian | `MR_small.dcm`, re-saved with dcmodify |
| `MR_small_bigendian.dcm` | 9,708 B | Explicit VR Big Endian (retired) | `MR_small.dcm`, converted with DCMTK dcmconv |

Checksums: `SHA256SUMS`, checked by `packages/core/test/fixtures.test.ts`.
