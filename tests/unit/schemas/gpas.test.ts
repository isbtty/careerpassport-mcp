import { describe, it, expect } from 'vitest'
import { GpaDtoSchema, GetGpasParamsSchema } from '../../../src/schemas/gpas.js'

describe('GpaDtoSchema', () => {
  it('accepts valid GPA DTO with all fields', () => {
    const result = GpaDtoSchema.parse({
      issuerName: 'University A',
      gpa: 3.85,
      maxGpa: 4.0,
      semester: 'Spring 2025',
      year: 2025,
    })

    expect(result.issuerName).toBe('University A')
    expect(result.gpa).toBe(3.85)
    expect(result.maxGpa).toBe(4.0)
  })

  it('accepts nullable optional fields as null', () => {
    const result = GpaDtoSchema.parse({
      issuerName: 'University',
      gpa: 3.5,
      maxGpa: null,
      semester: null,
      year: null,
    })

    expect(result.maxGpa).toBeNull()
    expect(result.semester).toBeNull()
    expect(result.year).toBeNull()
  })

  it('accepts minimal required fields only', () => {
    const result = GpaDtoSchema.parse({
      issuerName: 'University',
      gpa: 2.0,
    })

    expect(result.issuerName).toBe('University')
    expect(result.gpa).toBe(2.0)
  })
})

describe('GetGpasParamsSchema', () => {
  it('applies default pagination values', () => {
    const result = GetGpasParamsSchema.parse({})

    expect(result.fetchAll).toBe(true)
    expect(result.offset).toBe(0)
  })
})
