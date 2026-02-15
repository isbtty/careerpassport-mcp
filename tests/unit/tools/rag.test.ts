import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerRagTools } from '../../../src/tools/rag.js'
import type { ApiClient } from '../../../src/api/client.js'
import { ServerError } from '../../../src/errors/api-error.js'

describe('registerRagTools', () => {
  let mockServer: { tool: ReturnType<typeof vi.fn> }
  let mockApiClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }
  let ragRetrievalHandler: (args: Record<string, unknown>) => Promise<unknown>
  let ragGenerationHandler: (args: Record<string, unknown>) => Promise<unknown>

  beforeEach(() => {
    mockServer = { tool: vi.fn() }
    mockApiClient = { get: vi.fn(), post: vi.fn() }

    registerRagTools(
      mockServer as unknown as Parameters<typeof registerRagTools>[0],
      mockApiClient as unknown as ApiClient
    )

    const retrievalCall = mockServer.tool.mock.calls.find(
      (call: unknown[]) => call[0] === 'rag-retrieval'
    )
    ragRetrievalHandler = retrievalCall[3]

    const generationCall = mockServer.tool.mock.calls.find(
      (call: unknown[]) => call[0] === 'rag-generation'
    )
    ragGenerationHandler = generationCall[3]
  })

  it('registers both rag-retrieval and rag-generation tools', () => {
    const toolNames = mockServer.tool.mock.calls.map((call: unknown[]) => call[0])
    expect(toolNames).toContain('rag-retrieval')
    expect(toolNames).toContain('rag-generation')
  })

  describe('rag-retrieval handler', () => {
    it('sends POST request with ragCorpusId and query', async () => {
      mockApiClient.post.mockResolvedValue({ contexts: ['result1'] })

      await ragRetrievalHandler({ ragCorpusId: 'corpus-1', query: 'search query' })

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/vcs/v2/contents/retrieval',
        { ragCorpusId: 'corpus-1', query: 'search query' }
      )
    })

    it('returns retrieval results as JSON text', async () => {
      const responseData = { contexts: [{ text: 'relevant', score: 0.95 }] }
      mockApiClient.post.mockResolvedValue(responseData)

      const result = await ragRetrievalHandler({
        ragCorpusId: 'corpus-1',
        query: 'query',
      }) as { content: Array<{ text: string }> }

      const parsed = JSON.parse(result.content[0].text)
      expect(parsed).toEqual(responseData)
    })

    it('returns error tool result on API failure', async () => {
      mockApiClient.post.mockRejectedValue(new ServerError('error', 500))

      const result = await ragRetrievalHandler({
        ragCorpusId: 'corpus-1',
        query: 'query',
      }) as { isError: boolean }

      expect(result.isError).toBe(true)
    })
  })

  describe('rag-generation handler', () => {
    it('sends POST request with ragCorpusId and query', async () => {
      mockApiClient.post.mockResolvedValue({ generatedText: 'result' })

      await ragGenerationHandler({ ragCorpusId: 'corpus-2', query: 'generate something' })

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/vcs/v2/contents/generation',
        { ragCorpusId: 'corpus-2', query: 'generate something' }
      )
    })

    it('returns generation results as JSON text', async () => {
      const responseData = { generatedText: 'some output' }
      mockApiClient.post.mockResolvedValue(responseData)

      const result = await ragGenerationHandler({
        ragCorpusId: 'corpus-2',
        query: 'query',
      }) as { content: Array<{ text: string }> }

      const parsed = JSON.parse(result.content[0].text)
      expect(parsed).toEqual(responseData)
    })

    it('returns error tool result on API failure', async () => {
      mockApiClient.post.mockRejectedValue(new ServerError('error', 500))

      const result = await ragGenerationHandler({
        ragCorpusId: 'corpus-2',
        query: 'query',
      }) as { isError: boolean }

      expect(result.isError).toBe(true)
    })
  })
})
