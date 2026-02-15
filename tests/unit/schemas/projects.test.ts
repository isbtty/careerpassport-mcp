import { describe, it, expect } from 'vitest'
import { IssueProjectParamsSchema, ProjectDtoSchema, GetProjectsParamsSchema } from '../../../src/schemas/projects.js'

describe('IssueProjectParamsSchema', () => {
  it('accepts valid minimal input with only responsibility', () => {
    const result = IssueProjectParamsSchema.parse({
      responsibility: 'Lead developer',
    })

    expect(result.responsibility).toBe('Lead developer')
    expect(result.achievement).toBeUndefined()
  })

  it('accepts full input with all optional fields', () => {
    const result = IssueProjectParamsSchema.parse({
      responsibility: 'Lead',
      achievement: 'Shipped v2',
      title: 'Project X',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      roles: 'Tech Lead',
      teamStructure: '5 engineers',
    })

    expect(result.title).toBe('Project X')
    expect(result.roles).toBe('Tech Lead')
  })

  it('rejects empty responsibility', () => {
    expect(() =>
      IssueProjectParamsSchema.parse({ responsibility: '' })
    ).toThrow()
  })

  it('rejects missing responsibility', () => {
    expect(() =>
      IssueProjectParamsSchema.parse({ achievement: 'something' })
    ).toThrow()
  })
})

describe('GetProjectsParamsSchema', () => {
  it('applies pagination and organization filter defaults', () => {
    const result = GetProjectsParamsSchema.parse({})

    expect(result.fetchAll).toBe(true)
    expect(result.offset).toBe(0)
    expect(result.organizationIds).toBeUndefined()
  })
})

describe('ProjectDtoSchema', () => {
  it('accepts valid project DTO', () => {
    const result = ProjectDtoSchema.parse({
      issuerName: 'Company A',
      title: 'Project X',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      grantedAt: '2025-06-01',
      responsibility: 'Development',
      achievement: 'Delivered on time',
      roles: 'Developer',
      teamStructure: '3 people',
    })

    expect(result.issuerName).toBe('Company A')
  })

  it('accepts nullable optional fields as null', () => {
    const result = ProjectDtoSchema.parse({
      issuerName: 'Company',
      title: null,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      grantedAt: null,
      responsibility: 'Dev',
      achievement: 'Done',
      roles: 'Dev',
      teamStructure: 'Solo',
    })

    expect(result.title).toBeNull()
    expect(result.grantedAt).toBeNull()
  })
})
