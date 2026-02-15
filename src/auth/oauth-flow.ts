import { createInterface } from 'node:readline'
import { randomUUID } from 'node:crypto'
import type { OAuthConfig, TokenSet } from './types.js'
import { AuthenticationError } from '../errors/auth-error.js'

const REDIRECT_URI = 'http://localhost:19876/callback'

export async function authorize(config: Readonly<OAuthConfig>): Promise<TokenSet> {
  const state = randomUUID()

  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('state', state)

  process.stderr.write('\n=== Career Passport OAuth Authentication ===\n')
  process.stderr.write('\n1. Open this URL in your browser:\n\n')
  process.stderr.write(`  ${authUrl.toString()}\n\n`)
  process.stderr.write('2. Log in and authorize the application.\n')
  process.stderr.write('3. The browser will redirect to a URL that may fail to load.\n')
  process.stderr.write('4. Copy the FULL URL from the browser address bar and paste it here:\n\n')

  const callbackUrl = await readLineFromStderr('Callback URL> ')

  const parsed = new URL(callbackUrl)
  const code = parsed.searchParams.get('code')
  const returnedState = parsed.searchParams.get('state')
  const error = parsed.searchParams.get('error')

  if (error) {
    throw new AuthenticationError(`OAuth authorization denied: ${error}`)
  }

  if (returnedState !== state) {
    throw new AuthenticationError('OAuth state mismatch. Please try again.')
  }

  if (!code) {
    throw new AuthenticationError('No authorization code found in the URL.')
  }

  process.stderr.write('Exchanging code for tokens...\n')
  return exchangeCodeForTokens(config, code)
}

function readLineFromStderr(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stderr,
    })

    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function exchangeCodeForTokens(
  config: Readonly<OAuthConfig>,
  code: string
): Promise<TokenSet> {
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
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

  process.stderr.write('Authentication successful!\n\n')

  return Object.freeze({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? Date.now() + data.expires_in * 1000
      : 0,
  })
}
