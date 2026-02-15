import type { OAuthConfig, TokenSet } from './types.js'
import { AuthenticationError } from '../errors/auth-error.js'

export class OAuthClient {
  constructor(private readonly config: Readonly<OAuthConfig>) {}

  async refreshAccessToken(currentTokens: TokenSet): Promise<TokenSet> {
    if (!currentTokens.refreshToken) {
      throw new AuthenticationError('No refresh token available. Please re-authenticate.')
    }

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentTokens.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new AuthenticationError(
        `Token refresh failed (${response.status}): ${body}`
      )
    }

    const data = await response.json() as {
      access_token: string
      refresh_token?: string
      expires_in?: number
    }

    return Object.freeze({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? currentTokens.refreshToken,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : 0,
    })
  }
}
