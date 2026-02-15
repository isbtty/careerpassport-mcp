import { describe, it, expect } from 'vitest'
import {
  CareerPassportApiError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  RateLimitError,
  ServerError,
} from '../../../src/errors/api-error.js'

describe('CareerPassportApiError', () => {
  it('stores message, statusCode, and responseBody', () => {
    const error = new CareerPassportApiError('test error', 418, 'body text')

    expect(error.message).toBe('test error')
    expect(error.statusCode).toBe(418)
    expect(error.responseBody).toBe('body text')
    expect(error.name).toBe('CareerPassportApiError')
  })

  it('extends Error', () => {
    const error = new CareerPassportApiError('test', 500)

    expect(error).toBeInstanceOf(Error)
  })

  it('handles undefined responseBody', () => {
    const error = new CareerPassportApiError('test', 500)

    expect(error.responseBody).toBeUndefined()
  })
})

describe('ValidationError', () => {
  it('sets statusCode to 400', () => {
    const error = new ValidationError('bad input', 'details')

    expect(error.statusCode).toBe(400)
    expect(error.name).toBe('ValidationError')
    expect(error.message).toBe('bad input')
    expect(error.responseBody).toBe('details')
  })

  it('extends CareerPassportApiError', () => {
    const error = new ValidationError('bad input')

    expect(error).toBeInstanceOf(CareerPassportApiError)
    expect(error).toBeInstanceOf(Error)
  })
})

describe('NotFoundError', () => {
  it('sets statusCode to 404', () => {
    const error = new NotFoundError('not found', 'details')

    expect(error.statusCode).toBe(404)
    expect(error.name).toBe('NotFoundError')
    expect(error.message).toBe('not found')
  })

  it('extends CareerPassportApiError', () => {
    const error = new NotFoundError('missing')

    expect(error).toBeInstanceOf(CareerPassportApiError)
  })
})

describe('ForbiddenError', () => {
  it('sets statusCode to 403', () => {
    const error = new ForbiddenError('denied', 'body')

    expect(error.statusCode).toBe(403)
    expect(error.name).toBe('ForbiddenError')
    expect(error.message).toBe('denied')
  })

  it('extends CareerPassportApiError', () => {
    const error = new ForbiddenError('denied')

    expect(error).toBeInstanceOf(CareerPassportApiError)
  })
})

describe('RateLimitError', () => {
  it('sets statusCode to 429 and stores retryAfter', () => {
    const error = new RateLimitError('slow down', 60, 'body')

    expect(error.statusCode).toBe(429)
    expect(error.name).toBe('RateLimitError')
    expect(error.retryAfter).toBe(60)
    expect(error.responseBody).toBe('body')
  })

  it('handles undefined retryAfter', () => {
    const error = new RateLimitError('slow down')

    expect(error.retryAfter).toBeUndefined()
  })

  it('extends CareerPassportApiError', () => {
    const error = new RateLimitError('slow down')

    expect(error).toBeInstanceOf(CareerPassportApiError)
  })
})

describe('ServerError', () => {
  it('stores custom status code', () => {
    const error = new ServerError('internal error', 502, 'gateway timeout')

    expect(error.statusCode).toBe(502)
    expect(error.name).toBe('ServerError')
    expect(error.responseBody).toBe('gateway timeout')
  })

  it('extends CareerPassportApiError', () => {
    const error = new ServerError('error', 500)

    expect(error).toBeInstanceOf(CareerPassportApiError)
  })
})
