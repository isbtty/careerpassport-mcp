import { z } from 'zod'

const EnvSchema = z.object({
  CP_CLIENT_ID: z.string().min(1),
  CP_CLIENT_SECRET: z.string().min(1),
  CP_ACCESS_TOKEN: z.string().optional(),
  CP_REFRESH_TOKEN: z.string().optional(),
  CP_ENVIRONMENT: z.enum(['production', 'staging']).default('production'),
  CP_TRANSPORT: z.enum(['stdio', 'http']).default('stdio'),
  CP_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
})

export interface Config {
  readonly clientId: string
  readonly clientSecret: string
  readonly accessToken: string | undefined
  readonly refreshToken: string | undefined
  readonly environment: 'production' | 'staging'
  readonly transport: 'stdio' | 'http'
  readonly port: number
}

export function loadConfig(): Config {
  const parsed = EnvSchema.parse(process.env)

  return Object.freeze({
    clientId: parsed.CP_CLIENT_ID,
    clientSecret: parsed.CP_CLIENT_SECRET,
    accessToken: parsed.CP_ACCESS_TOKEN,
    refreshToken: parsed.CP_REFRESH_TOKEN,
    environment: parsed.CP_ENVIRONMENT,
    transport: parsed.CP_TRANSPORT,
    port: parsed.CP_PORT,
  })
}
