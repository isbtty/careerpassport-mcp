import { describe, it, expect } from 'vitest'
import { toToolResult } from '../../../src/errors/handler.js'
import { AuthenticationError } from '../../../src/errors/auth-error.js'
import {
  CareerPassportApiError,
  ForbiddenError,
  RateLimitError,
  ValidationError,
} from '../../../src/errors/api-error.js'

describe('toToolResult', () => {
  it('handles AuthenticationError with correct message', () => {
    const error = new AuthenticationError('token expired')
    const result = toToolResult(error)

    expect(result.isError).toBe(true)
    expect(result.content).toHaveLength(1)
    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('Authentication failed'),
    })
    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('token expired'),
    })
  })

  it('handles ValidationError with correct message', () => {
    const error = new ValidationError('invalid field', 'body')
    const result = toToolResult(error)

    expect(result.isError).toBe(true)
    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('Invalid request'),
    })
    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('invalid field'),
    })
  })

  it('handles ForbiddenError with correct message', () => {
    const error = new ForbiddenError('no permission', 'body')
    const result = toToolResult(error)

    expect(result.isError).toBe(true)
    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('Access denied'),
    })
    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('no permission'),
    })
  })

  it('handles RateLimitError with retryAfter', () => {
    const error = new RateLimitError('rate limited', 120, 'body')
    const result = toToolResult(error)

    expect(result.isError).toBe(true)
    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('Rate limit exceeded'),
    })
    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('Retry after 120 seconds'),
    })
  })

  it('handles RateLimitError without retryAfter', () => {
    const error = new RateLimitError('rate limited')
    const result = toToolResult(error)

    expect(result.isError).toBe(true)
    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('Please wait before retrying'),
    })
  })

  it('handles generic CareerPassportApiError', () => {
    const error = new CareerPassportApiError('api problem', 418, 'teapot')
    const result = toToolResult(error)

    expect(result.isError).toBe(true)
    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('Career Passport API error (418)'),
    })
  })

  it('handles unknown error types with generic message', () => {
    const result = toToolResult(new Error('something went wrong'))

    expect(result.isError).toBe(true)
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'An unexpected error occurred. Please try again later.',
    })
  })

  it('handles non-Error thrown values', () => {
    const result = toToolResult('string error')

    expect(result.isError).toBe(true)
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'An unexpected error occurred. Please try again later.',
    })
  })

  it('handles null thrown value', () => {
    const result = toToolResult(null)

    expect(result.isError).toBe(true)
  })

  it('handles undefined thrown value', () => {
    const result = toToolResult(undefined)

    expect(result.isError).toBe(true)
  })

  it('prioritizes ValidationError over CareerPassportApiError (inheritance check)', () => {
    const error = new ValidationError('bad input', 'details')
    const result = toToolResult(error)

    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('Invalid request'),
    })
    expect(result.content[0]).not.toEqual({
      type: 'text',
      text: expect.stringContaining('Career Passport API error'),
    })
  })

  it('prioritizes ForbiddenError over CareerPassportApiError (inheritance check)', () => {
    const error = new ForbiddenError('denied', 'body')
    const result = toToolResult(error)

    expect(result.content[0]).toEqual({
      type: 'text',
      text: expect.stringContaining('Access denied'),
    })
  })
})
