import { describe, it, expect } from 'vitest'
import { AuthenticationError } from '../../../src/errors/auth-error.js'

describe('AuthenticationError', () => {
  it('stores message and sets correct name', () => {
    const error = new AuthenticationError('auth failed')

    expect(error.message).toBe('auth failed')
    expect(error.name).toBe('AuthenticationError')
  })

  it('extends Error', () => {
    const error = new AuthenticationError('auth failed')

    expect(error).toBeInstanceOf(Error)
  })

  it('is not an instance of TypeError or RangeError', () => {
    const error = new AuthenticationError('auth failed')

    expect(error).not.toBeInstanceOf(TypeError)
    expect(error).not.toBeInstanceOf(RangeError)
  })

  it('has a stack trace', () => {
    const error = new AuthenticationError('with stack')

    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('AuthenticationError')
  })
})
