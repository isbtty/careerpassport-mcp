import 'dotenv/config'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { loadConfig } from './config/env.js'
import { getAuthUrl, getBaseUrl, getTokenUrl } from './config/urls.js'
import { TokenStore } from './auth/token-store.js'
import { OAuthClient } from './auth/oauth-client.js'
import { ApiClient } from './api/client.js'
import { createServer } from './server.js'
import { loadTokens, saveTokens } from './auth/token-file.js'
import { authorize } from './auth/oauth-flow.js'
import type { TokenSet } from './auth/types.js'

async function resolveTokens(
  config: ReturnType<typeof loadConfig>,
  oauthClient: OAuthClient,
  oauthConfig: Readonly<import('./auth/types.js').OAuthConfig>
): Promise<TokenSet> {
  if (config.accessToken) {
    return Object.freeze({
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
      expiresAt: 0,
    })
  }

  const saved = loadTokens()
  if (saved) {
    if (saved.expiresAt > 0 && Date.now() >= saved.expiresAt - 30_000) {
      try {
        const refreshed = await oauthClient.refreshAccessToken(saved)
        saveTokens(refreshed)
        return refreshed
      } catch {
        process.stderr.write('Token refresh failed. Starting new OAuth flow...\n')
      }
    } else {
      return saved
    }
  }

  const tokens = await authorize(oauthConfig)
  saveTokens(tokens)
  return tokens
}

async function main(): Promise<void> {
  const config = loadConfig()

  const oauthConfig = {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    tokenUrl: getTokenUrl(config.environment),
    authUrl: getAuthUrl(config.environment),
  }

  const oauthClient = new OAuthClient(oauthConfig)

  const tokens = await resolveTokens(config, oauthClient, oauthConfig)

  const tokenStore = new TokenStore(
    tokens.accessToken,
    tokens.refreshToken,
    (updated) => saveTokens(updated)
  )

  const apiClient = new ApiClient(
    getBaseUrl(config.environment),
    tokenStore,
    oauthClient
  )

  const server = createServer(apiClient)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  process.stderr.write(`Fatal: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
