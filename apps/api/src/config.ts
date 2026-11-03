import { z } from 'zod'

// Compose turns an unset `${PORT}` into '', so '' means "use the default".
const emptyAsUnset = (value: unknown) => (value === '' ? undefined : value)

const EnvSchema = z.object({
  PORT: z.preprocess(emptyAsUnset, z.coerce.number().int().min(1).max(65535).default(3001)),
})

export interface Config {
  port: number
}

/** Parses env once at startup and fails fast with a readable message. */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const result = EnvSchema.safeParse(env)
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid environment: ${details}`)
  }
  return { port: result.data.PORT }
}
