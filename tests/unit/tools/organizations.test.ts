import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerOrganizationTools } from '../../../src/tools/organizations.js'
import type { ApiClient } from '../../../src/api/client.js'
import { NotFoundError } from '../../../src/errors/api-error.js'

describe('registerOrganizationTools', () => {
  let mockServer: { tool: ReturnType<typeof vi.fn> }
  let mockApiClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }
  let getOrganizationsHandler: () => Promise<unknown>

  beforeEach(() => {
    mockServer = { tool: vi.fn() }
    mockApiClient = { get: vi.fn(), post: vi.fn() }

    registerOrganizationTools(
      mockServer as unknown as Parameters<typeof registerOrganizationTools>[0],
      mockApiClient as unknown as ApiClient
    )

    const toolCall = mockServer.tool.mock.calls.find(
      (call: unknown[]) => call[0] === 'get-organizations'
    )
    getOrganizationsHandler = toolCall[3]
  })

  it('registers the get-organizations tool', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'get-organizations',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('get-organizations handler', () => {
    it('calls apiClient.get with correct path', async () => {
      mockApiClient.get.mockResolvedValue([])

      await getOrganizationsHandler()

      expect(mockApiClient.get).toHaveBeenCalledWith('/vcs/v2/me/organizations')
    })

    it('returns organizations as JSON text content', async () => {
      const orgs = [{ id: 'org-1', name: 'Org A' }, { id: 'org-2', name: 'Org B' }]
      mockApiClient.get.mockResolvedValue(orgs)

      const result = await getOrganizationsHandler() as { content: Array<{ type: string; text: string }> }

      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')

      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.organizations).toEqual(orgs)
    })

    it('returns error tool result on API error', async () => {
      mockApiClient.get.mockRejectedValue(new NotFoundError('not found', 'body'))

      const result = await getOrganizationsHandler() as { isError: boolean }

      expect(result.isError).toBe(true)
    })
  })
})
