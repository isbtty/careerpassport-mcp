import { describe, it, expect } from 'vitest'
import { PaginationParamsSchema, OrganizationFilterSchema } from '../../../src/schemas/common.js'

describe('PaginationParamsSchema', () => {
  it('applies default values when no input provided', () => {
    const result = PaginationParamsSchema.parse({})

    expect(result.fetchAll).toBe(true)
    expect(result.offset).toBe(0)
  })

  it('accepts explicit fetchAll and offset values', () => {
    const result = PaginationParamsSchema.parse({ fetchAll: false, offset: 10 })

    expect(result.fetchAll).toBe(false)
    expect(result.offset).toBe(10)
  })

  it('rejects negative offset', () => {
    expect(() => PaginationParamsSchema.parse({ offset: -1 })).toThrow()
  })

  it('rejects non-integer offset', () => {
    expect(() => PaginationParamsSchema.parse({ offset: 1.5 })).toThrow()
  })

  it('rejects non-boolean fetchAll', () => {
    expect(() => PaginationParamsSchema.parse({ fetchAll: 'yes' })).toThrow()
  })
})

describe('OrganizationFilterSchema', () => {
  it('accepts undefined organizationIds', () => {
    const result = OrganizationFilterSchema.parse({})

    expect(result.organizationIds).toBeUndefined()
  })

  it('accepts valid organizationIds array', () => {
    const result = OrganizationFilterSchema.parse({
      organizationIds: ['org-1', 'org-2'],
    })

    expect(result.organizationIds).toEqual(['org-1', 'org-2'])
  })

  it('accepts empty array', () => {
    const result = OrganizationFilterSchema.parse({ organizationIds: [] })

    expect(result.organizationIds).toEqual([])
  })

  it('rejects array with more than 20 items', () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `org-${i}`)

    expect(() => OrganizationFilterSchema.parse({ organizationIds: tooMany })).toThrow()
  })

  it('accepts exactly 20 items', () => {
    const exactly20 = Array.from({ length: 20 }, (_, i) => `org-${i}`)
    const result = OrganizationFilterSchema.parse({ organizationIds: exactly20 })

    expect(result.organizationIds).toHaveLength(20)
  })
})
