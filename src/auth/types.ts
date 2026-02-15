export interface TokenSet {
  readonly accessToken: string
  readonly refreshToken: string | undefined
  readonly expiresAt: number
}

export interface OAuthConfig {
  readonly clientId: string
  readonly clientSecret: string
  readonly tokenUrl: string
  readonly authUrl: string
}
