import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadConfig } from '../../../src/config/env.js'

describe('loadConfig', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  function setRequiredEnv(): void {
    process.env.CP_CLIENT_ID = 'test-client-id'
    process.env.CP_CLIENT_SECRET = 'test-client-secret'
    process.env.CP_ACCESS_TOKEN = 'test-access-token'
  }

  it('parses all required environment variables', () => {
    setRequiredEnv()

    const config = loadConfig()

    expect(config.clientId).toBe('test-client-id')
    expect(config.clientSecret).toBe('test-client-secret')
    expect(config.accessToken).toBe('test-access-token')
  })

  it('applies default values for optional fields', () => {
    setRequiredEnv()

    const config = loadConfig()

    expect(config.environment).toBe('production')
    expect(config.transport).toBe('stdio')
    expect(config.port).toBe(3000)
    expect(config.refreshToken).toBeUndefined()
  })

  it('parses optional refresh token', () => {
    setRequiredEnv()
    process.env.CP_REFRESH_TOKEN = 'test-refresh-token'

    const config = loadConfig()

    expect(config.refreshToken).toBe('test-refresh-token')
  })

  it('accepts staging environment', () => {
    setRequiredEnv()
    process.env.CP_ENVIRONMENT = 'staging'

    const config = loadConfig()

    expect(config.environment).toBe('staging')
  })

  it('accepts http transport', () => {
    setRequiredEnv()
    process.env.CP_TRANSPORT = 'http'

    const config = loadConfig()

    expect(config.transport).toBe('http')
  })

  it('coerces port string to number', () => {
    setRequiredEnv()
    process.env.CP_PORT = '8080'

    const config = loadConfig()

    expect(config.port).toBe(8080)
  })

  it('throws when CP_CLIENT_ID is missing', () => {
    process.env.CP_CLIENT_SECRET = 'secret'
    process.env.CP_ACCESS_TOKEN = 'token'

    expect(() => loadConfig()).toThrow()
  })

  it('throws when CP_CLIENT_SECRET is missing', () => {
    process.env.CP_CLIENT_ID = 'id'
    process.env.CP_ACCESS_TOKEN = 'token'

    expect(() => loadConfig()).toThrow()
  })

  it('allows missing CP_ACCESS_TOKEN (returns undefined)', () => {
    process.env.CP_CLIENT_ID = 'id'
    process.env.CP_CLIENT_SECRET = 'secret'

    const config = loadConfig()

    expect(config.accessToken).toBeUndefined()
  })

  it('throws for empty CP_CLIENT_ID', () => {
    process.env.CP_CLIENT_ID = ''
    process.env.CP_CLIENT_SECRET = 'secret'
    process.env.CP_ACCESS_TOKEN = 'token'

    expect(() => loadConfig()).toThrow()
  })

  it('throws for invalid environment value', () => {
    setRequiredEnv()
    process.env.CP_ENVIRONMENT = 'invalid'

    expect(() => loadConfig()).toThrow()
  })

  it('throws for invalid transport value', () => {
    setRequiredEnv()
    process.env.CP_TRANSPORT = 'grpc'

    expect(() => loadConfig()).toThrow()
  })

  it('throws for port below 1', () => {
    setRequiredEnv()
    process.env.CP_PORT = '0'

    expect(() => loadConfig()).toThrow()
  })

  it('throws for port above 65535', () => {
    setRequiredEnv()
    process.env.CP_PORT = '70000'

    expect(() => loadConfig()).toThrow()
  })

  it('throws for non-numeric port', () => {
    setRequiredEnv()
    process.env.CP_PORT = 'abc'

    expect(() => loadConfig()).toThrow()
  })

  it('returns a frozen (immutable) config object', () => {
    setRequiredEnv()

    const config = loadConfig()

    expect(Object.isFrozen(config)).toBe(true)
  })

  it('does not allow mutation of returned config', () => {
    setRequiredEnv()

    const config = loadConfig()

    expect(() => {
      (config as Record<string, unknown>).clientId = 'mutated'
    }).toThrow()
  })
})
