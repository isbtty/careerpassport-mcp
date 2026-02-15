import { TokenStore } from '../auth/token-store.js'
import { OAuthClient } from '../auth/oauth-client.js'
import { AuthenticationError } from '../errors/auth-error.js'
import {
  CareerPassportApiError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ValidationError,
} from '../errors/api-error.js'

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenStore: TokenStore,
    private readonly oauthClient: OAuthClient
  ) {}

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, params)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    const doRequest = async (): Promise<Response> => {
      const url = new URL(path, this.baseUrl)
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== '') {
            url.searchParams.set(key, value)
          }
        }
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.tokenStore.getTokens().accessToken}`,
      }

      if (body !== undefined) {
        headers['Content-Type'] = 'application/json'
      }

      return fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    }

    let response = await doRequest()

    if (response.status === 401) {
      try {
        const newTokens = await this.oauthClient.refreshAccessToken(
          this.tokenStore.getTokens()
        )
        this.tokenStore.update(newTokens)
        response = await doRequest()
      } catch (refreshError) {
        if (refreshError instanceof AuthenticationError) {
          throw refreshError
        }
        throw new AuthenticationError(
          'Access token expired and refresh failed. Please re-authenticate.'
        )
      }
    }

    if (!response.ok) {
      const responseBody = await response.text().catch(() => '')
      this.throwApiError(response.status, responseBody, response.headers)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  private throwApiError(
    status: number,
    body: string,
    headers: Headers
  ): never {
    switch (status) {
      case 400:
        throw new ValidationError(`Bad request: ${body}`, body)
      case 401:
        throw new AuthenticationError('Authentication failed after token refresh')
      case 403:
        throw new ForbiddenError('Insufficient permissions', body)
      case 404:
        throw new NotFoundError('Resource not found', body)
      case 429: {
        const retryAfter = headers.get('retry-after')
        throw new RateLimitError(
          'Rate limit exceeded',
          retryAfter ? parseInt(retryAfter, 10) : undefined,
          body
        )
      }
      default:
        if (status >= 500) {
          throw new ServerError(`Server error: ${body}`, status, body)
        }
        throw new CareerPassportApiError(
          `API error: ${body}`,
          status,
          body
        )
    }
  }
}
