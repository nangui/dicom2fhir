#!/usr/bin/env bash
# Smoke test of the FHIR validator the agent loop relies on ("the validator decides").
# A valid ImagingStudy must pass, and one missing the required `status` must fail.
# Usage: VALIDATOR_URL=http://localhost:8080/fhir scripts/validator-smoke.sh
set -euo pipefail

base="${VALIDATOR_URL:-https://hapi.fhir.org/baseR4}"
base="${base%/}"

# Prints the number of error/fatal issues in the OperationOutcome.
count_errors() {
  curl -sS --fail-with-body --max-time 60 -X POST "$base/ImagingStudy/\$validate" \
    -H 'Content-Type: application/fhir+json' -H 'Accept: application/fhir+json' \
    --data "$1" \
    | jq '[.issue[]? | select(.severity == "error" or .severity == "fatal")] | length'
}
# HAPI answers 412/422 with an OperationOutcome when validation fails: keep the body.
count_errors_allow_fail() { count_errors "$1" 2>/dev/null || true; }

valid='{"resourceType":"ImagingStudy","status":"available","subject":{"reference":"Patient/example"}}'
missing_status='{"resourceType":"ImagingStudy","subject":{"reference":"Patient/example"}}'

ok=$(count_errors "$valid")
ko=$(count_errors_allow_fail "$missing_status")

echo "validator: $base"
echo "valid ImagingStudy          -> $ok error(s) (want 0)"
echo "ImagingStudy without status -> ${ko:-?} error(s) (want >= 1)"

[[ "$ok" == 0 ]] || { echo "FAIL: valid resource rejected"; exit 1; }
[[ "${ko:-0}" -ge 1 ]] || { echo "FAIL: invalid resource accepted"; exit 1; }
echo "OK"
