import { describe, it, expect } from 'vitest'
import { getBaseUrl, getTokenUrl, getAuthUrl } from '../../../src/config/urls.js'

describe('getBaseUrl', () => {
  it('returns production API URL for production environment', () => {
    expect(getBaseUrl('production')).toBe('https://api.sakazuki.xyz')
  })

  it('returns staging API URL for staging environment', () => {
    expect(getBaseUrl('staging')).toBe('https://api.staging.sakazuki.xyz')
  })
})

describe('getTokenUrl', () => {
  it('returns production token URL for production environment', () => {
    expect(getTokenUrl('production')).toBe('https://vcs.sakazuki.xyz/oauth2/token')
  })

  it('returns staging token URL for staging environment', () => {
    expect(getTokenUrl('staging')).toBe('https://vcs.staging.sakazuki.xyz/oauth2/token')
  })
})

describe('getAuthUrl', () => {
  it('returns production auth URL for production environment', () => {
    expect(getAuthUrl('production')).toBe('https://vcs.sakazuki.xyz/oauth2/authorize')
  })

  it('returns staging auth URL for staging environment', () => {
    expect(getAuthUrl('staging')).toBe('https://vcs.staging.sakazuki.xyz/oauth2/authorize')
  })
})
