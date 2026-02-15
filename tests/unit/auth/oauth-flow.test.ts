import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthenticationError } from '../../../src/errors/auth-error.js'
import type { OAuthConfig } from '../../../src/auth/types.js'

// Mock node:readline before importing the module under test
const mockQuestion = vi.fn()
const mockClose = vi.fn()

vi.mock('node:readline', () => ({
  createInterface: () => ({
    question: mockQuestion,
    close: mockClose,
  }),
}))

// Mock node:crypto to control state values
vi.mock('node:crypto', () => ({
  randomUUID: () => 'test-state-uuid',
}))

const { authorize } = await import('../../../src/auth/oauth-flow.js')

describe('oauth-flow', () => {
  const mockConfig: Readonly<OAuthConfig> = Object.freeze({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    tokenUrl: 'https://auth.example.com/oauth2/token',
    authUrl: 'https://auth.example.com/oauth2/authorize',
  })

  let originalFetch: typeof global.fetch
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    originalFetch = global.fetch
    stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
    mockQuestion.mockReset()
    mockClose.mockReset()
  })

  afterEach(() => {
    global.fetch = originalFetch
    stderrSpy.mockRestore()
  })

  function simulateUserPaste(url: string): void {
    mockQuestion.mockImplementation((_prompt: string, cb: (answer: string) => void) => {
      cb(url)
    })
  }

  describe('authorize', () => {
    it('displays authentication instructions on stderr', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=auth-code&state=test-state-uuid'
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'tok' }),
      })

      await authorize(mockConfig)

      const output = stderrSpy.mock.calls.map((c) => c[0]).join('')
      expect(output).toContain('Career Passport OAuth Authentication')
      expect(output).toContain('Open this URL in your browser')
      expect(output).toContain('auth.example.com')
      expect(output).toContain('Copy the FULL URL')
    })

    it('builds correct authorization URL with all parameters', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=auth-code&state=test-state-uuid'
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'tok' }),
      })

      await authorize(mockConfig)

      const output = stderrSpy.mock.calls.map((c) => c[0]).join('')
      expect(output).toContain('response_type=code')
      expect(output).toContain('client_id=test-client-id')
      expect(output).toContain('redirect_uri=http')
      expect(output).toContain('state=test-state-uuid')
    })

    it('throws AuthenticationError when callback URL contains error param', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?error=access_denied&state=test-state-uuid'
      )

      await expect(authorize(mockConfig)).rejects.toThrow(AuthenticationError)
      await expect(
        authorize(mockConfig)
      ).rejects.toThrow('OAuth authorization denied: access_denied')
    })

    it('throws AuthenticationError on state mismatch', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=auth-code&state=wrong-state'
      )

      await expect(authorize(mockConfig)).rejects.toThrow(AuthenticationError)
      await expect(
        authorize(mockConfig)
      ).rejects.toThrow('OAuth state mismatch')
    })

    it('throws AuthenticationError when no code in callback URL', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?state=test-state-uuid'
      )

      await expect(authorize(mockConfig)).rejects.toThrow(AuthenticationError)
      await expect(
        authorize(mockConfig)
      ).rejects.toThrow('No authorization code found')
    })

    it('exchanges code for tokens on success', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=valid-code&state=test-state-uuid'
      )

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          }),
      })
      global.fetch = mockFetch

      const result = await authorize(mockConfig)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://auth.example.com/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      )

      const body = mockFetch.mock.calls[0][1].body as URLSearchParams
      expect(body.get('grant_type')).toBe('authorization_code')
      expect(body.get('code')).toBe('valid-code')
      expect(body.get('client_id')).toBe('test-client-id')
      expect(body.get('client_secret')).toBe('test-client-secret')
      expect(body.get('redirect_uri')).toBe('http://localhost:19876/callback')

      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toBe('new-refresh-token')
    })

    it('returns a frozen token set', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=valid-code&state=test-state-uuid'
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'tok',
            refresh_token: 'ref',
            expires_in: 3600,
          }),
      })

      const result = await authorize(mockConfig)

      expect(Object.isFrozen(result)).toBe(true)
    })

    it('calculates expiresAt from expires_in', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-01T00:00:00Z'))

      simulateUserPaste(
        'http://localhost:19876/callback?code=valid-code&state=test-state-uuid'
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'tok',
            expires_in: 7200,
          }),
      })

      const result = await authorize(mockConfig)

      expect(result.expiresAt).toBe(Date.now() + 7200 * 1000)

      vi.useRealTimers()
    })

    it('sets expiresAt to 0 when expires_in is not provided', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=valid-code&state=test-state-uuid'
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'tok' }),
      })

      const result = await authorize(mockConfig)

      expect(result.expiresAt).toBe(0)
    })

    it('sets refreshToken to undefined when not provided by server', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=valid-code&state=test-state-uuid'
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'tok' }),
      })

      const result = await authorize(mockConfig)

      expect(result.refreshToken).toBeUndefined()
    })

    it('throws AuthenticationError when token exchange fails', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=valid-code&state=test-state-uuid'
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('invalid_grant'),
      })

      await expect(authorize(mockConfig)).rejects.toThrow(AuthenticationError)
      await expect(
        authorize(mockConfig)
      ).rejects.toThrow('Token exchange failed (400): invalid_grant')
    })

    it('handles response.text() failure gracefully on token exchange error', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=valid-code&state=test-state-uuid'
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.reject(new Error('read error')),
      })

      await expect(authorize(mockConfig)).rejects.toThrow(AuthenticationError)
      await expect(
        authorize(mockConfig)
      ).rejects.toThrow('Token exchange failed (500): ')
    })

    it('trims whitespace from pasted URL', async () => {
      mockQuestion.mockImplementation((_prompt: string, cb: (answer: string) => void) => {
        cb('  http://localhost:19876/callback?code=auth-code&state=test-state-uuid  ')
      })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'tok' }),
      })

      const result = await authorize(mockConfig)

      expect(result.accessToken).toBe('tok')
    })

    it('closes readline interface after reading input', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=auth-code&state=test-state-uuid'
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'tok' }),
      })

      await authorize(mockConfig)

      expect(mockClose).toHaveBeenCalled()
    })

    it('writes success message on successful token exchange', async () => {
      simulateUserPaste(
        'http://localhost:19876/callback?code=valid-code&state=test-state-uuid'
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ access_token: 'tok', expires_in: 3600 }),
      })

      await authorize(mockConfig)

      const output = stderrSpy.mock.calls.map((c) => c[0]).join('')
      expect(output).toContain('Authentication successful!')
    })
  })
})
