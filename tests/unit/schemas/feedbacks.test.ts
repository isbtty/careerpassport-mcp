import { describe, it, expect } from 'vitest'
import { IssueFeedbackParamsSchema, FeedbackDtoSchema } from '../../../src/schemas/feedbacks.js'

describe('IssueFeedbackParamsSchema', () => {
  it('accepts valid input with required fields', () => {
    const result = IssueFeedbackParamsSchema.parse({
      quantitativeScores: [{ category: 'teamwork', score: 5 }],
      strengthComment: 'Excellent collaboration',
    })

    expect(result.quantitativeScores).toHaveLength(1)
    expect(result.strengthComment).toBe('Excellent collaboration')
  })

  it('accepts all optional fields', () => {
    const result = IssueFeedbackParamsSchema.parse({
      quantitativeScores: [{ category: 'skill', score: 4 }],
      strengthComment: 'Good work',
      potentialComment: 'Can improve',
      startDate: '2025-01-01',
      endDate: '2025-06-30',
    })

    expect(result.potentialComment).toBe('Can improve')
    expect(result.startDate).toBe('2025-01-01')
  })

  it('rejects empty quantitativeScores array', () => {
    expect(() =>
      IssueFeedbackParamsSchema.parse({
        quantitativeScores: [],
        strengthComment: 'Good',
      })
    ).toThrow()
  })

  it('rejects empty strengthComment', () => {
    expect(() =>
      IssueFeedbackParamsSchema.parse({
        quantitativeScores: [{ category: 'skill', score: 3 }],
        strengthComment: '',
      })
    ).toThrow()
  })

  it('rejects missing quantitativeScores', () => {
    expect(() =>
      IssueFeedbackParamsSchema.parse({
        strengthComment: 'Good',
      })
    ).toThrow()
  })

  it('accepts multiple quantitative scores', () => {
    const result = IssueFeedbackParamsSchema.parse({
      quantitativeScores: [
        { category: 'skill', score: 4 },
        { category: 'teamwork', score: 5 },
        { category: 'communication', score: 3 },
      ],
      strengthComment: 'Multi-dimensional evaluation',
    })

    expect(result.quantitativeScores).toHaveLength(3)
  })
})

describe('FeedbackDtoSchema', () => {
  it('accepts valid feedback DTO', () => {
    const result = FeedbackDtoSchema.parse({
      issuerName: 'Manager A',
      url: 'https://example.com/feedback/1',
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      issuedAt: '2025-07-01',
      quantitativeFeedbacks: '[{"category":"skill","score":4}]',
      strengthComment: 'Good work',
      potentialComment: 'Can improve',
    })

    expect(result.issuerName).toBe('Manager A')
  })

  it('accepts nullable optional fields as null', () => {
    const result = FeedbackDtoSchema.parse({
      issuerName: 'Manager',
      url: null,
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      issuedAt: null,
      quantitativeFeedbacks: '[]',
      strengthComment: 'OK',
      potentialComment: null,
    })

    expect(result.url).toBeNull()
    expect(result.issuedAt).toBeNull()
    expect(result.potentialComment).toBeNull()
  })
})
