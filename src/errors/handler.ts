import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { AuthenticationError } from './auth-error.js'
import {
  CareerPassportApiError,
  ForbiddenError,
  RateLimitError,
  ValidationError,
} from './api-error.js'

export function toToolResult(error: unknown): CallToolResult {
  if (error instanceof AuthenticationError) {
    return {
      content: [{
        type: 'text',
        text: `Authentication failed: ${error.message}. Please verify your access token and refresh token are correctly configured.`,
      }],
      isError: true,
    }
  }

  if (error instanceof ValidationError) {
    return {
      content: [{
        type: 'text',
        text: `Invalid request: ${error.message}`,
      }],
      isError: true,
    }
  }

  if (error instanceof ForbiddenError) {
    return {
      content: [{
        type: 'text',
        text: `Access denied: ${error.message}. The OAuth client may not have permission for this operation.`,
      }],
      isError: true,
    }
  }

  if (error instanceof RateLimitError) {
    return {
      content: [{
        type: 'text',
        text: `Rate limit exceeded. ${error.retryAfter ? `Retry after ${error.retryAfter} seconds.` : 'Please wait before retrying.'}`,
      }],
      isError: true,
    }
  }

  if (error instanceof CareerPassportApiError) {
    return {
      content: [{
        type: 'text',
        text: `Career Passport API error (${error.statusCode}): ${error.message}`,
      }],
      isError: true,
    }
  }

  return {
    content: [{
      type: 'text',
      text: 'An unexpected error occurred. Please try again later.',
    }],
    isError: true,
  }
}
