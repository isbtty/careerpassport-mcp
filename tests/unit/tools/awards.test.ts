import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerAwardTools } from '../../../src/tools/awards.js'
import type { ApiClient } from '../../../src/api/client.js'
import { ValidationError } from '../../../src/errors/api-error.js'

describe('registerAwardTools', () => {
  let mockServer: { tool: ReturnType<typeof vi.fn> }
  let mockApiClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }
  let getAwardsHandler: (args: Record<string, unknown>) => Promise<unknown>

  beforeEach(() => {
    mockServer = { tool: vi.fn() }
    mockApiClient = { get: vi.fn(), post: vi.fn() }

    registerAwardTools(
      mockServer as unknown as Parameters<typeof registerAwardTools>[0],
      mockApiClient as unknown as ApiClient
    )

    const toolCall = mockServer.tool.mock.calls.find(
      (call: unknown[]) => call[0] === 'get-awards'
    )
    getAwardsHandler = toolCall[3]
  })

  it('registers the get-awards tool', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'get-awards',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('get-awards handler', () => {
    it('calls apiClient.get with correct path', async () => {
      mockApiClient.get.mockResolvedValue([{ title: 'Best Award' }])

      await getAwardsHandler({})

      expect(mockApiClient.get).toHaveBeenCalledWith('/vcs/v2/me/awards', {})
    })

    it('returns awards as JSON text content', async () => {
      const awards = [{ title: 'Award 1' }, { title: 'Award 2' }]
      mockApiClient.get.mockResolvedValue(awards)

      const result = await getAwardsHandler({}) as { content: Array<{ type: string; text: string }> }

      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')

      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.awards).toEqual(awards)
    })

    it('passes organizationIds as comma-separated string', async () => {
      mockApiClient.get.mockResolvedValue([])

      await getAwardsHandler({ organizationIds: ['org-1', 'org-2'] })

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/vcs/v2/me/awards',
        { organizationIds: 'org-1,org-2' }
      )
    })

    it('does not send organizationIds when not provided', async () => {
      mockApiClient.get.mockResolvedValue([])

      await getAwardsHandler({})

      expect(mockApiClient.get).toHaveBeenCalledWith('/vcs/v2/me/awards', {})
    })

    it('returns error tool result on API error', async () => {
      mockApiClient.get.mockRejectedValue(new ValidationError('bad request', 'body'))

      const result = await getAwardsHandler({}) as { isError: boolean; content: Array<{ text: string }> }

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Invalid request')
    })
  })
})
