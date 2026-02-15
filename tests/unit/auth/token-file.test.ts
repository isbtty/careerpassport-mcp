import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import type { TokenSet } from '../../../src/auth/types.js'

// We need to mock the module-level constants (TOKEN_DIR / TOKEN_PATH)
// that are derived from homedir(). We redirect homedir() to a temp dir.
const testDir = join(tmpdir(), `cp-mcp-test-${randomUUID()}`)
const tokenDir = join(testDir, '.careerpassport-mcp')
const tokenPath = join(tokenDir, 'tokens.json')

vi.mock('node:os', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:os')>()
  return {
    ...original,
    homedir: () => testDir,
  }
})

// Dynamic import so the mock is applied before the module evaluates
const { saveTokens, loadTokens, clearTokens, getTokenPath } = await import(
  '../../../src/auth/token-file.js'
)

describe('token-file', () => {
  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  const validTokens: TokenSet = Object.freeze({
    accessToken: 'access-abc',
    refreshToken: 'refresh-xyz',
    expiresAt: 1700000000000,
  })

  describe('getTokenPath', () => {
    it('returns a path under the mocked home directory', () => {
      expect(getTokenPath()).toBe(tokenPath)
    })
  })

  describe('saveTokens', () => {
    it('creates the token directory and writes the token file', () => {
      saveTokens(validTokens)

      expect(existsSync(tokenPath)).toBe(true)
    })

    it('writes valid JSON matching the token set', () => {
      saveTokens(validTokens)

      const raw = readFileSync(tokenPath, 'utf-8')
      const parsed = JSON.parse(raw)

      expect(parsed.accessToken).toBe('access-abc')
      expect(parsed.refreshToken).toBe('refresh-xyz')
      expect(parsed.expiresAt).toBe(1700000000000)
    })

    it('overwrites existing token file', () => {
      saveTokens(validTokens)

      const updatedTokens: TokenSet = Object.freeze({
        accessToken: 'access-new',
        refreshToken: 'refresh-new',
        expiresAt: 9999999999999,
      })

      saveTokens(updatedTokens)

      const raw = readFileSync(tokenPath, 'utf-8')
      const parsed = JSON.parse(raw)

      expect(parsed.accessToken).toBe('access-new')
    })

    it('handles tokens with undefined refresh token', () => {
      const tokensNoRefresh: TokenSet = Object.freeze({
        accessToken: 'access-only',
        refreshToken: undefined,
        expiresAt: 0,
      })

      saveTokens(tokensNoRefresh)

      const raw = readFileSync(tokenPath, 'utf-8')
      const parsed = JSON.parse(raw)

      expect(parsed.accessToken).toBe('access-only')
    })
  })

  describe('loadTokens', () => {
    it('returns the saved token set', () => {
      saveTokens(validTokens)

      const loaded = loadTokens()

      expect(loaded).not.toBeNull()
      expect(loaded!.accessToken).toBe('access-abc')
      expect(loaded!.refreshToken).toBe('refresh-xyz')
      expect(loaded!.expiresAt).toBe(1700000000000)
    })

    it('returns a frozen object', () => {
      saveTokens(validTokens)

      const loaded = loadTokens()

      expect(Object.isFrozen(loaded)).toBe(true)
    })

    it('returns null when no token file exists', () => {
      const loaded = loadTokens()

      expect(loaded).toBeNull()
    })

    it('returns null when file contains invalid JSON', () => {
      mkdirSync(tokenDir, { recursive: true })
      const { writeFileSync } = require('node:fs')
      writeFileSync(tokenPath, 'not valid json', 'utf-8')

      const loaded = loadTokens()

      expect(loaded).toBeNull()
    })

    it('returns null when accessToken is missing from data', () => {
      mkdirSync(tokenDir, { recursive: true })
      const { writeFileSync } = require('node:fs')
      writeFileSync(
        tokenPath,
        JSON.stringify({ refreshToken: 'r', expiresAt: 0 }),
        'utf-8'
      )

      const loaded = loadTokens()

      expect(loaded).toBeNull()
    })

    it('defaults refreshToken to undefined when not a string', () => {
      mkdirSync(tokenDir, { recursive: true })
      const { writeFileSync } = require('node:fs')
      writeFileSync(
        tokenPath,
        JSON.stringify({ accessToken: 'a', refreshToken: 123, expiresAt: 0 }),
        'utf-8'
      )

      const loaded = loadTokens()

      expect(loaded).not.toBeNull()
      expect(loaded!.refreshToken).toBeUndefined()
    })

    it('defaults expiresAt to 0 when not a number', () => {
      mkdirSync(tokenDir, { recursive: true })
      const { writeFileSync } = require('node:fs')
      writeFileSync(
        tokenPath,
        JSON.stringify({ accessToken: 'a', expiresAt: 'never' }),
        'utf-8'
      )

      const loaded = loadTokens()

      expect(loaded).not.toBeNull()
      expect(loaded!.expiresAt).toBe(0)
    })
  })

  describe('clearTokens', () => {
    it('removes the token file', () => {
      saveTokens(validTokens)
      expect(existsSync(tokenPath)).toBe(true)

      clearTokens()

      expect(existsSync(tokenPath)).toBe(false)
    })

    it('does not throw when token file does not exist', () => {
      expect(() => clearTokens()).not.toThrow()
    })
  })
})
