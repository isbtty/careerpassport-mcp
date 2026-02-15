import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { exec } from 'node:child_process'
import { platform } from 'node:os'
import type { OAuthConfig, TokenSet } from './types.js'
import { AuthenticationError } from '../errors/auth-error.js'

const CALLBACK_PORT = 19876
const TIMEOUT_MS = 300_000

function getCallbackHost(): string {
  return process.env['CP_CALLBACK_HOST'] ?? 'localhost'
}

function getRedirectUri(): string {
  return `http://${getCallbackHost()}:${CALLBACK_PORT}/callback`
}

function tryOpenBrowser(url: string): void {
  const cmd = platform() === 'darwin'
    ? `open "${url}"`
    : platform() === 'win32'
      ? `start "${url}"`
      : `xdg-open "${url}"`

  exec(cmd, () => {
    // silently ignore - URL is always printed to stderr
  })
}

export async function authorize(config: Readonly<OAuthConfig>): Promise<TokenSet> {
  const state = randomUUID()
  const redirectUri = getRedirectUri()

  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  const code = await waitForCallback(state, authUrl.toString(), redirectUri)
  return exchangeCodeForTokens(config, code, redirectUri)
}

function waitForCallback(
  expectedState: string,
  authUrl: string,
  redirectUri: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close()
      reject(new AuthenticationError('OAuth authorization timed out. Please try again.'))
    }, TIMEOUT_MS)

    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${CALLBACK_PORT}`)

      if (url.pathname !== '/callback') {
        res.writeHead(404)
        res.end('Not found')
        return
      }

      const code = url.searchParams.get('code')
      const returnedState = url.searchParams.get('state')
      const error = url.searchParams.get('error')

      if (error) {
        res.writeHead(400)
        res.end(`Authorization denied: ${error}`)
        clearTimeout(timeout)
        server.close()
        reject(new AuthenticationError(`OAuth authorization denied: ${error}`))
        return
      }

      if (returnedState !== expectedState) {
        res.writeHead(400)
        res.end('Invalid state parameter')
        clearTimeout(timeout)
        server.close()
        reject(new AuthenticationError('OAuth state mismatch. Possible CSRF attack.'))
        return
      }

      if (!code) {
        res.writeHead(400)
        res.end('Missing authorization code')
        clearTimeout(timeout)
        server.close()
        reject(new AuthenticationError('No authorization code received.'))
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<html><body><h1>Authentication successful</h1><p>You can close this window.</p></body></html>')
      clearTimeout(timeout)
      server.close()
      resolve(code)
    })

    // Listen on 0.0.0.0 so remote browsers (e.g. from Mac to headless Pi) can reach the callback
    server.listen(CALLBACK_PORT, '0.0.0.0', () => {
      process.stderr.write('\n=== Career Passport OAuth Authentication ===\n')
      process.stderr.write(`Callback: ${redirectUri}\n`)
      process.stderr.write(`\nOpen this URL in your browser:\n\n  ${authUrl}\n\n`)
      process.stderr.write('Waiting for authentication...\n')
      tryOpenBrowser(authUrl)
    })

    server.on('error', (err) => {
      clearTimeout(timeout)
      reject(new AuthenticationError(`Failed to start callback server: ${err.message}`))
    })
  })
}

async function exchangeCodeForTokens(
  config: Readonly<OAuthConfig>,
  code: string,
  redirectUri: string
): Promise<TokenSet> {
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new AuthenticationError(
      `Token exchange failed (${response.status}): ${body}`
    )
  }

  const data = await response.json() as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }

  return Object.freeze({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? Date.now() + data.expires_in * 1000
      : 0,
  })
}
