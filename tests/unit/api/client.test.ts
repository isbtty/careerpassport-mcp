import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient } from '../../../src/api/client.js'
import { TokenStore } from '../../../src/auth/token-store.js'
import { OAuthClient } from '../../../src/auth/oauth-client.js'
import { AuthenticationError } from '../../../src/errors/auth-error.js'
import {
  CareerPassportApiError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  RateLimitError,
  ServerError,
} from '../../../src/errors/api-error.js'

describe('ApiClient', () => {
  let tokenStore: TokenStore
  let oauthClient: OAuthClient
  let apiClient: ApiClient
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    tokenStore = new TokenStore('test-access-token', 'test-refresh-token')
    oauthClient = new OAuthClient({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      tokenUrl: 'https://auth.example.com/token',
    })
    apiClient = new ApiClient('https://api.example.com', tokenStore, oauthClient)
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  function mockFetch(response: Partial<Response> & { ok: boolean; status: number }): ReturnType<typeof vi.fn> {
    const mockFn = vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.status,
      headers: response.headers ?? new Headers(),
      json: response.json ?? (() => Promise.resolve({})),
      text: response.text ?? (() => Promise.resolve('')),
    })
    global.fetch = mockFn
    return mockFn
  }

  describe('get', () => {
    it('sends GET request with Bearer token in Authorization header', async () => {
      const fetchMock = mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      })

      await apiClient.get('/api/v2/test')

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/api/v2/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        })
      )
    })

    it('appends query parameters to URL', async () => {
      const fetchMock = mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })

      await apiClient.get('/api/test', { offset: '0', limit: '10' })

      const calledUrl = fetchMock.mock.calls[0][0]
      expect(calledUrl).toContain('offset=0')
      expect(calledUrl).toContain('limit=10')
    })

    it('skips empty and undefined query parameter values', async () => {
      const fetchMock = mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })

      await apiClient.get('/api/test', { key1: 'value1', key2: '', key3: 'value3' })

      const calledUrl = fetchMock.mock.calls[0][0]
      expect(calledUrl).toContain('key1=value1')
      expect(calledUrl).not.toContain('key2')
      expect(calledUrl).toContain('key3=value3')
    })

    it('returns parsed JSON response', async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, name: 'test' }),
      })

      const result = await apiClient.get<{ id: number; name: string }>('/api/test')

      expect(result).toEqual({ id: 1, name: 'test' })
    })

    it('does not set Content-Type for GET requests', async () => {
      const fetchMock = mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })

      await apiClient.get('/api/test')

      const headers = fetchMock.mock.calls[0][1].headers
      expect(headers['Content-Type']).toBeUndefined()
    })
  })

  describe('post', () => {
    it('sends POST request with JSON body and Content-Type header', async () => {
      const fetchMock = mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ created: true }),
      })

      const body = { name: 'test project' }
      await apiClient.post('/api/test', body)

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(body),
        })
      )
    })

    it('sends POST without body when none provided', async () => {
      const fetchMock = mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })

      await apiClient.post('/api/test')

      const callArgs = fetchMock.mock.calls[0][1]
      expect(callArgs.body).toBeUndefined()
      expect(callArgs.headers['Content-Type']).toBeUndefined()
    })

    it('returns undefined for 204 No Content responses', async () => {
      mockFetch({ ok: true, status: 204 })

      const result = await apiClient.post('/api/test', { data: 'test' })

      expect(result).toBeUndefined()
    })
  })

  describe('401 retry with token refresh', () => {
    it('refreshes token and retries on 401 response', async () => {
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        callCount++
        if (callCount === 1) {
          return { ok: false, status: 401, headers: new Headers(), text: () => Promise.resolve('') }
        }
        if (callCount === 2) {
          // This is the OAuth refresh call
          return {
            ok: true,
            json: () => Promise.resolve({
              access_token: 'new-access-token',
              refresh_token: 'new-refresh-token',
              expires_in: 3600,
            }),
          }
        }
        // Retry of original request
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve({ retried: true }),
        }
      })

      const result = await apiClient.get<{ retried: boolean }>('/api/test')

      expect(result).toEqual({ retried: true })
      expect(tokenStore.getTokens().accessToken).toBe('new-access-token')
    })

    it('throws AuthenticationError when refresh fails with AuthenticationError', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
        text: () => Promise.resolve(''),
      })

      vi.spyOn(oauthClient, 'refreshAccessToken').mockRejectedValue(
        new AuthenticationError('No refresh token available')
      )

      await expect(apiClient.get('/api/test')).rejects.toThrow(AuthenticationError)
      await expect(apiClient.get('/api/test')).rejects.toThrow('No refresh token available')
    })

    it('throws generic AuthenticationError when refresh fails with non-auth error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
        text: () => Promise.resolve(''),
      })

      vi.spyOn(oauthClient, 'refreshAccessToken').mockRejectedValue(
        new Error('Network failure')
      )

      await expect(apiClient.get('/api/test')).rejects.toThrow(AuthenticationError)
      await expect(apiClient.get('/api/test')).rejects.toThrow(
        'Access token expired and refresh failed'
      )
    })
  })

  describe('error mapping', () => {
    it('throws ValidationError for 400 responses', async () => {
      mockFetch({
        ok: false,
        status: 400,
        text: () => Promise.resolve('missing field'),
      })

      await expect(apiClient.get('/api/test')).rejects.toThrow(ValidationError)
    })

    it('throws AuthenticationError for 401 after successful refresh but still 401', async () => {
      vi.spyOn(oauthClient, 'refreshAccessToken').mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'refresh',
        expiresAt: 0,
      })

      let callCount = 0
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++
        return {
          ok: false,
          status: 401,
          headers: new Headers(),
          text: () => Promise.resolve('still unauthorized'),
        }
      })

      await expect(apiClient.get('/api/test')).rejects.toThrow(AuthenticationError)
    })

    it('throws ForbiddenError for 403 responses', async () => {
      mockFetch({
        ok: false,
        status: 403,
        text: () => Promise.resolve('forbidden'),
      })

      await expect(apiClient.get('/api/test')).rejects.toThrow(ForbiddenError)
    })

    it('throws NotFoundError for 404 responses', async () => {
      mockFetch({
        ok: false,
        status: 404,
        text: () => Promise.resolve('not found'),
      })

      await expect(apiClient.get('/api/test')).rejects.toThrow(NotFoundError)
    })

    it('throws RateLimitError for 429 responses with retry-after header', async () => {
      const headers = new Headers()
      headers.set('retry-after', '60')

      mockFetch({
        ok: false,
        status: 429,
        headers,
        text: () => Promise.resolve('too many requests'),
      })

      try {
        await apiClient.get('/api/test')
        expect.unreachable('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError)
        expect((error as RateLimitError).retryAfter).toBe(60)
      }
    })

    it('throws RateLimitError for 429 without retry-after header', async () => {
      mockFetch({
        ok: false,
        status: 429,
        text: () => Promise.resolve('too many'),
      })

      try {
        await apiClient.get('/api/test')
        expect.unreachable('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError)
        expect((error as RateLimitError).retryAfter).toBeUndefined()
      }
    })

    it('throws ServerError for 500 responses', async () => {
      mockFetch({
        ok: false,
        status: 500,
        text: () => Promise.resolve('internal server error'),
      })

      await expect(apiClient.get('/api/test')).rejects.toThrow(ServerError)
    })

    it('throws ServerError for 502 responses', async () => {
      mockFetch({
        ok: false,
        status: 502,
        text: () => Promise.resolve('bad gateway'),
      })

      await expect(apiClient.get('/api/test')).rejects.toThrow(ServerError)
    })

    it('throws generic CareerPassportApiError for other status codes', async () => {
      mockFetch({
        ok: false,
        status: 418,
        text: () => Promise.resolve('I am a teapot'),
      })

      await expect(apiClient.get('/api/test')).rejects.toThrow(CareerPassportApiError)
    })

    it('handles text() failure gracefully when reading error body', async () => {
      mockFetch({
        ok: false,
        status: 500,
        text: () => Promise.reject(new Error('read error')),
      })

      await expect(apiClient.get('/api/test')).rejects.toThrow(ServerError)
    })
  })
})
