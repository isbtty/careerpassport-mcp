import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TokenStore } from '../../../src/auth/token-store.js'

describe('TokenStore', () => {
  describe('constructor', () => {
    it('stores initial access token and refresh token', () => {
      const store = new TokenStore('access-123', 'refresh-456')
      const tokens = store.getTokens()

      expect(tokens.accessToken).toBe('access-123')
      expect(tokens.refreshToken).toBe('refresh-456')
    })

    it('stores undefined refresh token', () => {
      const store = new TokenStore('access-123', undefined)
      const tokens = store.getTokens()

      expect(tokens.refreshToken).toBeUndefined()
    })

    it('sets initial expiresAt to 0', () => {
      const store = new TokenStore('access-123', 'refresh-456')
      const tokens = store.getTokens()

      expect(tokens.expiresAt).toBe(0)
    })

    it('returns a frozen token object', () => {
      const store = new TokenStore('access-123', 'refresh-456')
      const tokens = store.getTokens()

      expect(Object.isFrozen(tokens)).toBe(true)
    })
  })

  describe('isExpired', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns false when expiresAt is 0 (initial state)', () => {
      const store = new TokenStore('access-123', 'refresh-456')

      expect(store.isExpired()).toBe(false)
    })

    it('returns false when token is well within validity period', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      const store = new TokenStore('access-123', 'refresh-456')

      const futureExpiry = Date.now() + 120_000
      store.update({
        accessToken: 'new-access',
        refreshToken: 'refresh-456',
        expiresAt: futureExpiry,
      })

      expect(store.isExpired()).toBe(false)
    })

    it('returns true when token is within 30-second buffer of expiry', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      const store = new TokenStore('access-123', 'refresh-456')

      const almostExpired = Date.now() + 29_000
      store.update({
        accessToken: 'new-access',
        refreshToken: 'refresh-456',
        expiresAt: almostExpired,
      })

      expect(store.isExpired()).toBe(true)
    })

    it('returns true when token is past expiry', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      const store = new TokenStore('access-123', 'refresh-456')

      const pastExpiry = Date.now() - 1000
      store.update({
        accessToken: 'new-access',
        refreshToken: 'refresh-456',
        expiresAt: pastExpiry,
      })

      expect(store.isExpired()).toBe(true)
    })

    it('returns false when exactly at 30-second boundary', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      const store = new TokenStore('access-123', 'refresh-456')

      const exactBoundary = Date.now() + 30_001
      store.update({
        accessToken: 'new-access',
        refreshToken: 'refresh-456',
        expiresAt: exactBoundary,
      })

      expect(store.isExpired()).toBe(false)
    })
  })

  describe('update', () => {
    it('replaces tokens with new values', () => {
      const store = new TokenStore('old-access', 'old-refresh')

      store.update({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresAt: 999999,
      })

      const tokens = store.getTokens()
      expect(tokens.accessToken).toBe('new-access')
      expect(tokens.refreshToken).toBe('new-refresh')
      expect(tokens.expiresAt).toBe(999999)
    })

    it('freezes the updated token object', () => {
      const store = new TokenStore('access', 'refresh')

      store.update({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresAt: 1000,
      })

      const tokens = store.getTokens()
      expect(Object.isFrozen(tokens)).toBe(true)
    })

    it('does not affect the original token set reference', () => {
      const store = new TokenStore('access-1', 'refresh-1')
      const originalTokens = store.getTokens()

      store.update({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
        expiresAt: 5000,
      })

      expect(originalTokens.accessToken).toBe('access-1')
      expect(store.getTokens().accessToken).toBe('access-2')
    })

    it('creates a defensive copy (does not share reference with input)', () => {
      const store = new TokenStore('access', 'refresh')
      const inputTokens = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresAt: 1000,
      }

      store.update(inputTokens)

      const storedTokens = store.getTokens()
      expect(storedTokens).not.toBe(inputTokens)
      expect(storedTokens.accessToken).toBe('new-access')
    })
  })

  describe('getTokens', () => {
    it('returns the same frozen object on repeated calls (before update)', () => {
      const store = new TokenStore('access', 'refresh')

      const first = store.getTokens()
      const second = store.getTokens()

      expect(first).toBe(second)
    })
  })

  describe('onUpdate callback', () => {
    it('calls onUpdate with new tokens when update is invoked', () => {
      const onUpdate = vi.fn()
      const store = new TokenStore('access', 'refresh', onUpdate)

      store.update({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresAt: 5000,
      })

      expect(onUpdate).toHaveBeenCalledOnce()
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          expiresAt: 5000,
        })
      )
    })

    it('passes a frozen token object to onUpdate', () => {
      const onUpdate = vi.fn()
      const store = new TokenStore('access', 'refresh', onUpdate)

      store.update({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresAt: 1000,
      })

      const receivedTokens = onUpdate.mock.calls[0][0]
      expect(Object.isFrozen(receivedTokens)).toBe(true)
    })

    it('calls onUpdate on every update invocation', () => {
      const onUpdate = vi.fn()
      const store = new TokenStore('access', 'refresh', onUpdate)

      store.update({ accessToken: 'a1', refreshToken: 'r1', expiresAt: 1 })
      store.update({ accessToken: 'a2', refreshToken: 'r2', expiresAt: 2 })
      store.update({ accessToken: 'a3', refreshToken: 'r3', expiresAt: 3 })

      expect(onUpdate).toHaveBeenCalledTimes(3)
    })

    it('does not throw when onUpdate is not provided', () => {
      const store = new TokenStore('access', 'refresh')

      expect(() => {
        store.update({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          expiresAt: 1000,
        })
      }).not.toThrow()
    })
  })
})
