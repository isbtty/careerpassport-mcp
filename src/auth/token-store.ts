import type { TokenSet } from './types.js'

const TOKEN_EXPIRY_BUFFER_MS = 30_000

export class TokenStore {
  private tokens: TokenSet
  private readonly onUpdate?: (tokens: TokenSet) => void

  constructor(
    accessToken: string,
    refreshToken: string | undefined,
    onUpdate?: (tokens: TokenSet) => void
  ) {
    this.onUpdate = onUpdate
    this.tokens = Object.freeze({
      accessToken,
      refreshToken,
      expiresAt: 0,
    })
  }

  getTokens(): TokenSet {
    return this.tokens
  }

  isExpired(): boolean {
    if (this.tokens.expiresAt === 0) {
      return false
    }
    return Date.now() >= this.tokens.expiresAt - TOKEN_EXPIRY_BUFFER_MS
  }

  update(newTokens: TokenSet): void {
    this.tokens = Object.freeze({ ...newTokens })
    this.onUpdate?.(this.tokens)
  }
}
