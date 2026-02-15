import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerFeedbackTools } from '../../../src/tools/feedbacks.js'
import type { ApiClient } from '../../../src/api/client.js'
import { ServerError } from '../../../src/errors/api-error.js'

describe('registerFeedbackTools', () => {
  let mockServer: { tool: ReturnType<typeof vi.fn> }
  let mockApiClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }
  let getFeedbacksHandler: (args: Record<string, unknown>) => Promise<unknown>
  let issueFeedbackHandler: (args: Record<string, unknown>) => Promise<unknown>

  beforeEach(() => {
    mockServer = { tool: vi.fn() }
    mockApiClient = { get: vi.fn(), post: vi.fn() }

    registerFeedbackTools(
      mockServer as unknown as Parameters<typeof registerFeedbackTools>[0],
      mockApiClient as unknown as ApiClient
    )

    const getFeedbacksCall = mockServer.tool.mock.calls.find(
      (call: unknown[]) => call[0] === 'get-feedbacks'
    )
    getFeedbacksHandler = getFeedbacksCall[3]

    const issueFeedbackCall = mockServer.tool.mock.calls.find(
      (call: unknown[]) => call[0] === 'issue-feedback'
    )
    issueFeedbackHandler = issueFeedbackCall[3]
  })

  it('registers both get-feedbacks and issue-feedback tools', () => {
    const toolNames = mockServer.tool.mock.calls.map((call: unknown[]) => call[0])
    expect(toolNames).toContain('get-feedbacks')
    expect(toolNames).toContain('issue-feedback')
  })

  describe('get-feedbacks handler', () => {
    it('fetches all pages when fetchAll is true', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({
          total: 3,
          next: '/next',
          nextOffset: 2,
          result: [{ id: 1 }, { id: 2 }],
        })
        .mockResolvedValueOnce({
          total: 3,
          next: null,
          nextOffset: null,
          result: [{ id: 3 }],
        })

      const result = await getFeedbacksHandler({ fetchAll: true, offset: 0 }) as {
        content: Array<{ text: string }>
      }

      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.total).toBe(3)
      expect(parsed.feedbacks).toHaveLength(3)
    })

    it('fetches single page when fetchAll is false', async () => {
      mockApiClient.get.mockResolvedValue({
        total: 10,
        next: '/next',
        nextOffset: 5,
        result: [{ id: 1 }],
      })

      const result = await getFeedbacksHandler({ fetchAll: false, offset: 0 }) as {
        content: Array<{ text: string }>
      }

      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.total).toBe(10)
      expect(parsed.nextOffset).toBe(5)
      expect(parsed.result).toHaveLength(1)
    })

    it('passes offset parameter as string', async () => {
      mockApiClient.get.mockResolvedValue({
        total: 0,
        next: null,
        nextOffset: null,
        result: [],
      })

      await getFeedbacksHandler({ fetchAll: false, offset: 5 })

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/vcs/v2/me/feedbacks',
        expect.objectContaining({ offset: '5' })
      )
    })

    it('passes organizationIds as comma-separated string', async () => {
      mockApiClient.get.mockResolvedValue({
        total: 0,
        next: null,
        nextOffset: null,
        result: [],
      })

      await getFeedbacksHandler({
        fetchAll: false,
        offset: 0,
        organizationIds: ['org-a', 'org-b'],
      })

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/vcs/v2/me/feedbacks',
        expect.objectContaining({ organizationIds: 'org-a,org-b' })
      )
    })

    it('returns error tool result on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new ServerError('server error', 500))

      const result = await getFeedbacksHandler({ fetchAll: false, offset: 0 }) as {
        isError: boolean
      }

      expect(result.isError).toBe(true)
    })
  })

  describe('issue-feedback handler', () => {
    it('sends POST request with feedback data', async () => {
      mockApiClient.post.mockResolvedValue(undefined)

      const args = {
        quantitativeScores: [{ category: 'teamwork', score: 5 }],
        strengthComment: 'Great teamwork',
        potentialComment: 'Could improve communication',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
      }

      await issueFeedbackHandler(args)

      expect(mockApiClient.post).toHaveBeenCalledWith('/vcs/v2/me/feedbacks', args)
    })

    it('returns success message on successful issuance', async () => {
      mockApiClient.post.mockResolvedValue(undefined)

      const result = await issueFeedbackHandler({
        quantitativeScores: [{ category: 'skill', score: 4 }],
        strengthComment: 'Good work',
      }) as { content: Array<{ text: string }> }

      expect(result.content[0].text).toBe('Feedback certificate issued successfully.')
    })

    it('returns error tool result on API failure', async () => {
      mockApiClient.post.mockRejectedValue(new ServerError('failed', 500))

      const result = await issueFeedbackHandler({
        quantitativeScores: [{ category: 'skill', score: 4 }],
        strengthComment: 'Good work',
      }) as { isError: boolean }

      expect(result.isError).toBe(true)
    })
  })
})
