import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OAuthClient } from '../../../src/auth/oauth-client.js'
import { AuthenticationError } from '../../../src/errors/auth-error.js'
import type { TokenSet, OAuthConfig } from '../../../src/auth/types.js'

describe('OAuthClient', () => {
  const mockConfig: OAuthConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    tokenUrl: 'https://auth.example.com/oauth2/token',
    authUrl: 'https://auth.example.com/oauth2/authorize',
  }

  const mockCurrentTokens: TokenSet = Object.freeze({
    accessToken: 'old-access-token',
    refreshToken: 'old-refresh-token',
    expiresAt: 0,
  })

  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  describe('refreshAccessToken', () => {
    it('throws AuthenticationError when no refresh token is available', async () => {
      const client = new OAuthClient(mockConfig)
      const tokensWithoutRefresh: TokenSet = Object.freeze({
        accessToken: 'access',
        refreshToken: undefined,
        expiresAt: 0,
      })

      await expect(
        client.refreshAccessToken(tokensWithoutRefresh)
      ).rejects.toThrow(AuthenticationError)
      await expect(
        client.refreshAccessToken(tokensWithoutRefresh)
      ).rejects.toThrow('No refresh token available')
    })

    it('sends correct request to token endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        }),
      })
      global.fetch = mockFetch

      const client = new OAuthClient(mockConfig)
      await client.refreshAccessToken(mockCurrentTokens)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://auth.example.com/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      )

      const call = mockFetch.mock.calls[0]
      const body = call[1].body as URLSearchParams
      expect(body.get('grant_type')).toBe('refresh_token')
      expect(body.get('refresh_token')).toBe('old-refresh-token')
      expect(body.get('client_id')).toBe('test-client-id')
      expect(body.get('client_secret')).toBe('test-client-secret')
    })

    it('returns new frozen token set on successful refresh', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        }),
      })

      const client = new OAuthClient(mockConfig)
      const result = await client.refreshAccessToken(mockCurrentTokens)

      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toBe('new-refresh-token')
      expect(result.expiresAt).toBe(Date.now() + 3600 * 1000)
      expect(Object.isFrozen(result)).toBe(true)
    })

    it('preserves current refresh token when server does not return one', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access-token',
        }),
      })

      const client = new OAuthClient(mockConfig)
      const result = await client.refreshAccessToken(mockCurrentTokens)

      expect(result.refreshToken).toBe('old-refresh-token')
    })

    it('sets expiresAt to 0 when expires_in is not provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access-token',
        }),
      })

      const client = new OAuthClient(mockConfig)
      const result = await client.refreshAccessToken(mockCurrentTokens)

      expect(result.expiresAt).toBe(0)
    })

    it('throws AuthenticationError on non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('invalid_grant'),
      })

      const client = new OAuthClient(mockConfig)

      await expect(
        client.refreshAccessToken(mockCurrentTokens)
      ).rejects.toThrow(AuthenticationError)
      await expect(
        client.refreshAccessToken(mockCurrentTokens)
      ).rejects.toThrow('Token refresh failed (400): invalid_grant')
    })

    it('handles response.text() failure gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.reject(new Error('read error')),
      })

      const client = new OAuthClient(mockConfig)

      await expect(
        client.refreshAccessToken(mockCurrentTokens)
      ).rejects.toThrow(AuthenticationError)
      await expect(
        client.refreshAccessToken(mockCurrentTokens)
      ).rejects.toThrow('Token refresh failed (500): ')
    })

    it('calculates correct expiry for various expires_in values', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access',
          expires_in: 1800,
        }),
      })

      const client = new OAuthClient(mockConfig)
      const result = await client.refreshAccessToken(mockCurrentTokens)

      expect(result.expiresAt).toBe(Date.now() + 1800 * 1000)
    })
  })
})
