import { z } from 'zod'

export const RagRetrievalParamsSchema = z.object({
  ragCorpusId: z.string().min(1)
    .describe('The ID of the RAG corpus to search'),
  query: z.string().min(1)
    .describe('The search query'),
})

export const RagGenerationParamsSchema = z.object({
  ragCorpusId: z.string().min(1)
    .describe('The ID of the RAG corpus to use for generation'),
  query: z.string().min(1)
    .describe('The query with subject for content generation'),
})
