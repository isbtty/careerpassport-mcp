import { describe, it, expect } from 'vitest'
import { OrganizationDtoSchema } from '../../../src/schemas/organizations.js'

describe('OrganizationDtoSchema', () => {
  it('accepts valid organization DTO', () => {
    const result = OrganizationDtoSchema.parse({
      id: 'org-123',
      name: 'Test Organization',
    })

    expect(result.id).toBe('org-123')
    expect(result.name).toBe('Test Organization')
  })

  it('rejects missing id', () => {
    expect(() => OrganizationDtoSchema.parse({ name: 'Org' })).toThrow()
  })

  it('rejects missing name', () => {
    expect(() => OrganizationDtoSchema.parse({ id: '123' })).toThrow()
  })

  it('rejects empty object', () => {
    expect(() => OrganizationDtoSchema.parse({})).toThrow()
  })

  it('rejects non-string id', () => {
    expect(() => OrganizationDtoSchema.parse({ id: 123, name: 'Org' })).toThrow()
  })
})
