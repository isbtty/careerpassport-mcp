export class CareerPassportApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly responseBody?: string
  ) {
    super(message)
    this.name = 'CareerPassportApiError'
  }
}

export class ValidationError extends CareerPassportApiError {
  constructor(message: string, responseBody?: string) {
    super(message, 400, responseBody)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends CareerPassportApiError {
  constructor(message: string, responseBody?: string) {
    super(message, 404, responseBody)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends CareerPassportApiError {
  constructor(message: string, responseBody?: string) {
    super(message, 403, responseBody)
    this.name = 'ForbiddenError'
  }
}

export class RateLimitError extends CareerPassportApiError {
  readonly retryAfter: number | undefined

  constructor(message: string, retryAfter?: number, responseBody?: string) {
    super(message, 429, responseBody)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

export class ServerError extends CareerPassportApiError {
  constructor(message: string, statusCode: number, responseBody?: string) {
    super(message, statusCode, responseBody)
    this.name = 'ServerError'
  }
}
