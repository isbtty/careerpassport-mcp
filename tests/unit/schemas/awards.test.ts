import { describe, it, expect } from 'vitest'
import { AwardDtoSchema, GetAwardsParamsSchema } from '../../../src/schemas/awards.js'

describe('AwardDtoSchema', () => {
  it('accepts valid award DTO', () => {
    const result = AwardDtoSchema.parse({
      issuerName: 'Company A',
      title: 'Best Employee',
      date: '2025-12-01',
      detail: 'Outstanding performance',
    })

    expect(result.issuerName).toBe('Company A')
    expect(result.title).toBe('Best Employee')
    expect(result.date).toBe('2025-12-01')
    expect(result.detail).toBe('Outstanding performance')
  })

  it('accepts null detail', () => {
    const result = AwardDtoSchema.parse({
      issuerName: 'Company',
      title: 'Award',
      date: '2025-01-01',
      detail: null,
    })

    expect(result.detail).toBeNull()
  })

  it('accepts missing detail (optional)', () => {
    const result = AwardDtoSchema.parse({
      issuerName: 'Company',
      title: 'Award',
      date: '2025-01-01',
    })

    expect(result.detail).toBeUndefined()
  })

  it('rejects missing required fields', () => {
    expect(() => AwardDtoSchema.parse({ issuerName: 'Company' })).toThrow()
    expect(() => AwardDtoSchema.parse({ title: 'Award' })).toThrow()
  })
})

describe('GetAwardsParamsSchema', () => {
  it('inherits OrganizationFilterSchema', () => {
    const result = GetAwardsParamsSchema.parse({})

    expect(result.organizationIds).toBeUndefined()
  })

  it('accepts organizationIds', () => {
    const result = GetAwardsParamsSchema.parse({
      organizationIds: ['org-1'],
    })

    expect(result.organizationIds).toEqual(['org-1'])
  })
})
