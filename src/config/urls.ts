type Environment = 'production' | 'staging'

const BASE_URLS: Record<Environment, string> = {
  production: 'https://api.sakazuki.xyz',
  staging: 'https://api.staging.sakazuki.xyz',
}

const TOKEN_URLS: Record<Environment, string> = {
  production: 'https://vcs.sakazuki.xyz/oauth2/token',
  staging: 'https://vcs.staging.sakazuki.xyz/oauth2/token',
}

const AUTH_URLS: Record<Environment, string> = {
  production: 'https://vcs.sakazuki.xyz/oauth2/authorize',
  staging: 'https://vcs.staging.sakazuki.xyz/oauth2/authorize',
}

export function getBaseUrl(env: Environment): string {
  return BASE_URLS[env]
}

export function getTokenUrl(env: Environment): string {
  return TOKEN_URLS[env]
}

export function getAuthUrl(env: Environment): string {
  return AUTH_URLS[env]
}
