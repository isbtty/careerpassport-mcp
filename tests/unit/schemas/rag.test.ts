import { describe, it, expect } from 'vitest'
import { RagRetrievalParamsSchema, RagGenerationParamsSchema } from '../../../src/schemas/rag.js'

describe('RagRetrievalParamsSchema', () => {
  it('accepts valid ragCorpusId and query', () => {
    const result = RagRetrievalParamsSchema.parse({
      ragCorpusId: 'corpus-123',
      query: 'search term',
    })

    expect(result.ragCorpusId).toBe('corpus-123')
    expect(result.query).toBe('search term')
  })

  it('rejects empty ragCorpusId', () => {
    expect(() =>
      RagRetrievalParamsSchema.parse({ ragCorpusId: '', query: 'search' })
    ).toThrow()
  })

  it('rejects empty query', () => {
    expect(() =>
      RagRetrievalParamsSchema.parse({ ragCorpusId: 'corpus', query: '' })
    ).toThrow()
  })

  it('rejects missing ragCorpusId', () => {
    expect(() =>
      RagRetrievalParamsSchema.parse({ query: 'search' })
    ).toThrow()
  })

  it('rejects missing query', () => {
    expect(() =>
      RagRetrievalParamsSchema.parse({ ragCorpusId: 'corpus' })
    ).toThrow()
  })
})

describe('RagGenerationParamsSchema', () => {
  it('accepts valid ragCorpusId and query', () => {
    const result = RagGenerationParamsSchema.parse({
      ragCorpusId: 'corpus-456',
      query: 'generate text about topic',
    })

    expect(result.ragCorpusId).toBe('corpus-456')
    expect(result.query).toBe('generate text about topic')
  })

  it('rejects empty ragCorpusId', () => {
    expect(() =>
      RagGenerationParamsSchema.parse({ ragCorpusId: '', query: 'query' })
    ).toThrow()
  })

  it('rejects empty query', () => {
    expect(() =>
      RagGenerationParamsSchema.parse({ ragCorpusId: 'corpus', query: '' })
    ).toThrow()
  })
})
