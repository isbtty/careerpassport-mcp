import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerGpaTools } from '../../../src/tools/gpas.js'
import type { ApiClient } from '../../../src/api/client.js'
import { ServerError } from '../../../src/errors/api-error.js'

describe('registerGpaTools', () => {
  let mockServer: { tool: ReturnType<typeof vi.fn> }
  let mockApiClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }
  let getGpasHandler: (args: Record<string, unknown>) => Promise<unknown>

  beforeEach(() => {
    mockServer = { tool: vi.fn() }
    mockApiClient = { get: vi.fn(), post: vi.fn() }

    registerGpaTools(
      mockServer as unknown as Parameters<typeof registerGpaTools>[0],
      mockApiClient as unknown as ApiClient
    )

    const toolCall = mockServer.tool.mock.calls.find(
      (call: unknown[]) => call[0] === 'get-gpas'
    )
    getGpasHandler = toolCall[3]
  })

  it('registers the get-gpas tool', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'get-gpas',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('get-gpas handler', () => {
    it('fetches all pages when fetchAll is true', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({
          total: 2,
          next: '/next',
          nextOffset: 1,
          result: [{ gpa: 3.5 }],
        })
        .mockResolvedValueOnce({
          total: 2,
          next: null,
          nextOffset: null,
          result: [{ gpa: 3.8 }],
        })

      const result = await getGpasHandler({ fetchAll: true, offset: 0 }) as {
        content: Array<{ text: string }>
      }

      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.total).toBe(2)
      expect(parsed.gpas).toHaveLength(2)
    })

    it('fetches single page when fetchAll is false', async () => {
      mockApiClient.get.mockResolvedValue({
        total: 5,
        next: '/next',
        nextOffset: 2,
        result: [{ gpa: 3.9 }],
      })

      const result = await getGpasHandler({ fetchAll: false, offset: 0 }) as {
        content: Array<{ text: string }>
      }

      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.total).toBe(5)
      expect(parsed.result).toHaveLength(1)
    })

    it('passes organizationIds filter', async () => {
      mockApiClient.get.mockResolvedValue({
        total: 0,
        next: null,
        nextOffset: null,
        result: [],
      })

      await getGpasHandler({
        fetchAll: false,
        offset: 0,
        organizationIds: ['org-1'],
      })

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/vcs/v2/me/gpas',
        expect.objectContaining({ organizationIds: 'org-1' })
      )
    })

    it('returns error tool result on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new ServerError('error', 500))

      const result = await getGpasHandler({ fetchAll: false, offset: 0 }) as { isError: boolean }

      expect(result.isError).toBe(true)
    })
  })
})
