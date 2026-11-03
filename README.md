# DICOM2FHIR Explorer

Drop a folder of DICOM files in your browser, audit it for identifying data, and turn its metadata into a validated FHIR R4 Bundle. The files never leave your machine.

> **Demo project.** Not a medical device. No image interpretation, no diagnosis. Use public, de-identified datasets only.

## What it does

Work in progress: the foundation (milestone 1) is done; the features below are being built in order. See [Status](#status).

1. **Dataset dashboard.** Parses DICOM headers locally (Web Workers) and summarizes studies, series, modalities and transfer syntaxes.
2. **De-identification audit.** Deterministic rules inspired by DICOM PS3.15 and mapped to the 18 HIPAA Safe Harbor identifiers flag what is still identifying, including the `BurnedInAnnotation` warning a header-only audit cannot clear. Rules decide; AI only explains.
3. **FHIR R4 generation.** A Claude agent turns audited, allowlisted metadata into a transaction Bundle (ImagingStudy, Endpoint, pseudonymous Patient, Provenance). A FHIR validator checks every attempt, in a fix loop of at most 3 iterations. The model proposes; the validator decides.
4. **Optional PACS round trip.** Store to Orthanc over DICOMweb (STOW-RS) and view in OHIF.

## Privacy model

```
 Browser (your machine)                     Server (api)                 External
 ┌────────────────────────────┐   audited,  ┌──────────────────────┐
 │ DICOM files  ──► parse     │  allowlisted│ re-checks payload    │ ──► Claude API
 │              ──► audit     │ ──metadata─►│ (zod strict schema)  │
 │ pixels & PHI stay here     │    only     │ ANTHROPIC_API_KEY    │ ──► FHIR $validate
 └────────────────────────────┘             └──────────────────────┘
```

- DICOM files, pixel data and identifying values never leave the browser.
- The server accepts only a strict, allowlisted metadata schema and checks it again before calling any model.
- The API key lives server-side only; it is never shipped to the browser or baked into an image.
- These are privacy-by-design controls. This project does not claim HIPAA compliance.

## Architecture

pnpm monorepo, TypeScript end to end.

| Package | Role | Stack |
| --- | --- | --- |
| `packages/core` | Pure logic shared by browser and server: DICOM readers, audit rules, payload schema, FHIR checks | TypeScript, `dicom-parser`, zod |
| `apps/web` | Upload, dashboard, audit and FHIR views | Vite, React 19, TanStack Query, tRPC client |
| `apps/api` | Agent loop and validation, the only holder of secrets | Hono, tRPC, Anthropic SDK |

Package boundaries are enforced by ESLint: `web` may only `import type` from `api`, and `core` imports no framework or Node API.

## Quick start

Requirements: Node 24 (see `.nvmrc`), pnpm 10.30 (pinned in `packageManager`), and optionally Docker.

```bash
pnpm install
pnpm docker:up     # install + api + web in containers, waits until healthy
open http://localhost:5173
pnpm docker:down
```

Or run on the host: `pnpm --filter @dicom2fhir/api dev` and `pnpm --filter @dicom2fhir/web dev`.

| Script | What it does |
| --- | --- |
| `pnpm test` | Vitest across all packages |
| `pnpm typecheck` | `tsc` across all packages |
| `pnpm lint` | ESLint, including package boundary rules |
| `pnpm build` | Production build of the web app |
| `scripts/validator-smoke.sh` | Checks the FHIR validator accepts a valid ImagingStudy and rejects an invalid one |

## FHIR validation

The agent's output is checked with HAPI FHIR `$validate`, configured by `VALIDATOR_URL`.

| Where | Validator |
| --- | --- |
| Local dev (default) | Public server `https://hapi.fhir.org/baseR4` |
| Local, opt in | `docker compose --profile validator up -d hapi` (needs a Docker VM with 3 GB or more) |
| CI | HAPI container started by the `validator` job |

Only FHIR generated from audited metadata is ever sent to a validator.

## Datasets

Large files live in `data/`, which is ignored by git. Licenses are recorded per dataset when it is added (milestone 2).

| Dataset | Source | Used for | License |
| --- | --- | --- | --- |
| pydicom test files (`CT_small.dcm`, `MR_small.dcm`, ...) | [pydicom](https://github.com/pydicom/pydicom) | Unit test fixtures | To record in M2 |
| Imaging Data Commons collections | [IDC](https://portal.imaging.datacommons.cancer.gov/) via `idc-index` | Dashboard demos | Per collection, to record in M2 |
| TCIA collections | [The Cancer Imaging Archive](https://www.cancerimagingarchive.net/) | Dashboard demos | Per collection, to record in M2 |
| Pseudo-PHI-DICOM-Data | TCIA | Audit demos: synthetic PHI planted in DICOM headers | To record in M2 |

Pseudo-PHI data is handled as if it were real PHI: it never leaves the browser.

## Status

| Milestone | Scope | State |
| --- | --- | --- |
| M1 | Monorepo, web, api, tRPC, ESLint boundaries, Docker dev stack, CI | Done |
| M2 | Data script and DICOM utilities | Next |
| M3 | Parsing in Web Workers | Planned |
| M4 | Upload UI | Planned |
| M5 | Dataset dashboard | Planned |
| M6 | De-identification audit with HIPAA Safe Harbor mapping | Planned |
| M7 | Agent: FHIR Bundle, Provenance, validator fix loop | Planned |
| M9 | FHIR views | Planned |
| M10 | Evaluation | Planned |
| M11 | Vercel deployment | Planned |
| M12 | Optional: production images, Orthanc and OHIF | Planned |

## Disclaimer

For education and demonstration only. Not a medical device, not for clinical use, and not a statement of HIPAA or any other regulatory compliance.

## License

[MIT](LICENSE)
