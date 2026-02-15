import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { TokenSet } from './types.js'

const TOKEN_DIR = join(homedir(), '.careerpassport-mcp')
const TOKEN_PATH = join(TOKEN_DIR, 'tokens.json')

export function saveTokens(tokens: TokenSet): void {
  mkdirSync(TOKEN_DIR, { recursive: true })
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf-8')
}

export function loadTokens(): TokenSet | null {
  try {
    const raw = readFileSync(TOKEN_PATH, 'utf-8')
    const data = JSON.parse(raw) as Record<string, unknown>

    if (typeof data.accessToken !== 'string') {
      return null
    }

    return Object.freeze({
      accessToken: data.accessToken,
      refreshToken: typeof data.refreshToken === 'string' ? data.refreshToken : undefined,
      expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : 0,
    })
  } catch {
    return null
  }
}

export function clearTokens(): void {
  try {
    rmSync(TOKEN_PATH)
  } catch {
    // file doesn't exist, nothing to do
  }
}

export function getTokenPath(): string {
  return TOKEN_PATH
}
