# CLAUDE.md

DICOM2FHIR Explorer: drop DICOM files in the browser, audit them for identifying data, and generate a validated FHIR R4 Bundle from audited metadata. A portfolio project for health tech interviews, built as live-coding practice.

## Non-negotiable principles

- **DICOM files never leave the browser.** Only audited, allowlisted, non-identifying metadata goes to the server, which re-checks it.
- **Rules decide; AI only explains.** The de-identification audit is deterministic code. Claude may phrase explanations, never decide.
- **The model proposes; the validator decides.** Generated FHIR is accepted only after a functional check and HAPI `$validate`, with at most 3 fix iterations.
- **No image interpretation, no diagnosis.**
- **Public de-identified datasets only.** Pseudo-PHI data is treated as real PHI.
- **No compliance claims.** Describe privacy-by-design controls; never say "HIPAA compliant".
- **`ANTHROPIC_API_KEY` is server-side only.** Never in the browser, never a Docker build arg.
- **Ask before any paid run** (Claude API evals).

## Coaching rules (how we work)

The owner is training to code faster for live-coding interviews. Answer in French.

- **Tests first, written by Claude** (Vitest), before any implementation.
- Each task states the file path, the signature and a target time (10 to 25 minutes).
- **Claude may write implementations, but shows them before writing.**
- For interview-worthy logic (DICOM readers, aggregation, worker pool, audit rules, agent loop, validation), **ask "toi ou moi ?" with a preview**. If the owner writes it, give hints by level only on request: "hint 1", "hint 2", "solution".
- Config and boilerplate: show, then write.
- Review when the owner says "done". Do an adversarial review when asked, and verify findings by running code, not by reading only.
- Never commit unless asked. Never rewrite history or create remote resources without explicit approval.

## Monorepo map

```
packages/core   Pure TS shared by browser and server (dicom/, audit/, payload/, fhir/)
apps/web        Vite + React 19 + TanStack Query + tRPC client
apps/api        Hono + tRPC; agent loop and validation; the only place with secrets
docker/         Dev image (Node + pnpm) and the HAPI healthcheck (Health.java)
scripts/        validator-smoke.sh
```

Boundaries, enforced by ESLint (`eslint.config.js`):

- `apps/web` may only `import type` from `@dicom2fhir/api` (tests may import its runtime to run it in-process).
- `packages/core` imports no React, Hono, tRPC, `node:*`, or app packages.

Packages are consumed from source (`exports` point to `.ts`), no build step between them.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm test` / `pnpm typecheck` / `pnpm lint` / `pnpm build` | Checks across all packages |
| `pnpm docker:up` / `pnpm docker:down` | Dev stack: install, api (:3001), web (:5173) |
| `docker compose --profile validator up -d hapi` | Local HAPI (:8080), needs a VM with 3 GB or more |
| `scripts/validator-smoke.sh` | Validator accepts a valid ImagingStudy and rejects one without `status` |

Gotcha: **`pnpm up` is pnpm's alias for `pnpm update`.** Use `pnpm docker:up`.

## Configuration (`apps/api/src/config.ts`)

Parsed once at startup with zod; fails fast with a readable message. Empty values count as unset.

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `3001` | Integer 1 to 65535 |
| `VALIDATOR_URL` | `https://hapi.fhir.org/baseR4` | http(s) only, trailing slash removed |
| `ANTHROPIC_API_KEY` | none | Added in M7, server only |

## Docker and Vercel roles

- **Docker Compose is for local dev only.** Services run as non-root with a read-only root filesystem, dropped capabilities and tini as PID 1. Commands exec binaries directly, because pnpm does not forward SIGTERM. Host `node_modules` are hidden behind named volumes, since the macOS binaries do not run in Linux.
- Rancher's virtiofs mount delivers no inotify events, so watchers use `CHOKIDAR_USEPOLLING`.
- HAPI is behind the `validator` profile: the dev VM has 2 GB. It runs in CI instead.
- **Vercel (M11) is production:** Vercel Services, with `web` (Vite SPA) and `api` (Hono). `/api/*` is routed to `api`. HAPI cannot run there, so production uses the public validator.

## Conventions

- **Every commit passes on its own** (install with frozen lockfile, lint, typecheck, test). CI checks this on PRs. The lockfile goes in the same commit as the `package.json` that changed it.
- Conventional commits (`feat(api): ...`, `chore: ...`).
- Inject dependencies (clock, logger, clients) so tests need no network or real time. `createApp(deps)` is the pattern.
- Never return `err.message` or stack traces to clients: JSON `{ error }` from Hono, and masked `INTERNAL_SERVER_ERROR` from tRPC. Messages can carry metadata.
- Test names describe behavior. Use `getByRole` in UI tests.
- GitHub Actions are pinned to commit SHAs.
- Owner-facing docs: no long dashes.

## Domain vocabulary

- **DICOM tag**: `(group,element)` header field, e.g. `(0010,0010)` PatientName. In `dicom-parser` the key is `x00100010` (`toTagKey`).
- **UIDs**: Study, Series and SOP Instance UIDs identify the DICOM hierarchy and map to `ImagingStudy.identifier`, `series.uid` and `instance.uid`.
- **PS3.15 Annex E**: DICOM's de-identification profile (which attributes to remove, replace or keep).
- **HIPAA Safe Harbor**: removing the 18 listed identifiers. Ages over 89 are grouped. The alternative is Expert Determination.
- **BurnedInAnnotation `(0028,0301)`**: text burned into pixels. A header-only audit cannot clear it, so flag it.
- **FHIR R4 ImagingStudy / Endpoint / Provenance**: study summary, where to retrieve images (DICOMweb), and who or what produced the resource.
- **`$validate` and OperationOutcome**: the FHIR validation operation and its list of issues with severities.
- **DICOMweb**: QIDO-RS (query), WADO-RS (retrieve), STOW-RS (store).
- Also relevant in interviews: PACS, RIS, VNA, HL7 v2 (ADT, ORM, ORU), US Core, SMART on FHIR, LOINC, SNOMED CT, RadLex.

## Progress log

- **M1 done (2026-11-03).**
  - pnpm workspace; `core` with `toTagKey`.
  - `web` (Vite, React, Testing Library).
  - `api` (Hono with `/api/health`, env config, JSON errors, graceful shutdown).
  - tRPC `ping` with an in-process end-to-end test.
  - ESLint boundaries.
  - Docker dev stack.
  - CI: check, per-commit and HAPI validator jobs.
  - README, LICENSE and this file.
- **Next: M2**, data script (`data/`, gitignored) and DICOM utilities in `core`.
- Known trade-off: `web` typechecks `api` sources through `AppRouter`. If Node types clash in M7, move `AppRouter` to a type-only module.
