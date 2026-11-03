import { z } from 'zod'

// Compose turns an unset `${VAR}` into '', so '' means "use the default".
const emptyAsUnset = (value: unknown) => (value === '' ? undefined : value)

// Only generated FHIR (built from audited, non-identifying metadata) is sent here.
const PUBLIC_VALIDATOR_URL = 'https://hapi.fhir.org/baseR4'

const EnvSchema = z.object({
  PORT: z.preprocess(emptyAsUnset, z.coerce.number().int().min(1).max(65535).default(3001)),
  VALIDATOR_URL: z.preprocess(
    emptyAsUnset,
    z
      .url({ protocol: /^https?$/ })
      .default(PUBLIC_VALIDATOR_URL)
      .transform((url) => url.replace(/\/+$/, '')),
  ),
})

export interface Config {
  port: number
  /** FHIR base URL whose `$validate` the agent loop calls. */
  validatorUrl: string
}

/** Parses env once at startup and fails fast with a readable message. */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const result = EnvSchema.safeParse(env)
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid environment: ${details}`)
  }
  return { port: result.data.PORT, validatorUrl: result.data.VALIDATOR_URL }
}
