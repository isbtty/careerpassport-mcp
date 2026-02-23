import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerProjectTools } from '../../../src/tools/projects.js'
import type { ApiClient } from '../../../src/api/client.js'
import { ServerError } from '../../../src/errors/api-error.js'

describe('registerProjectTools', () => {
  let mockServer: { tool: ReturnType<typeof vi.fn> }
  let mockApiClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }
  let getProjectsHandler: (args: Record<string, unknown>) => Promise<unknown>
  let issueProjectHandler: (args: Record<string, unknown>) => Promise<unknown>

  beforeEach(() => {
    mockServer = { tool: vi.fn() }
    mockApiClient = { get: vi.fn(), post: vi.fn() }

    registerProjectTools(
      mockServer as unknown as Parameters<typeof registerProjectTools>[0],
      mockApiClient as unknown as ApiClient
    )

    const getProjectsCall = mockServer.tool.mock.calls.find(
      (call: unknown[]) => call[0] === 'get-projects'
    )
    getProjectsHandler = getProjectsCall[3]

    const issueProjectCall = mockServer.tool.mock.calls.find(
      (call: unknown[]) => call[0] === 'issue-project'
    )
    issueProjectHandler = issueProjectCall[3]
  })

  it('registers both get-projects and issue-project tools', () => {
    const toolNames = mockServer.tool.mock.calls.map((call: unknown[]) => call[0])
    expect(toolNames).toContain('get-projects')
    expect(toolNames).toContain('issue-project')
  })

  describe('get-projects handler', () => {
    it('fetches all pages when fetchAll is true', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({
          total: 3,
          next: '/next',
          nextOffset: 2,
          result: [{ title: 'P1' }, { title: 'P2' }],
        })
        .mockResolvedValueOnce({
          total: 3,
          next: null,
          nextOffset: null,
          result: [{ title: 'P3' }],
        })

      const result = await getProjectsHandler({ fetchAll: true, offset: 0 }) as {
        content: Array<{ text: string }>
      }

      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.total).toBe(3)
      expect(parsed.projects).toHaveLength(3)
    })

    it('fetches single page when fetchAll is false', async () => {
      mockApiClient.get.mockResolvedValue({
        total: 10,
        next: '/next',
        nextOffset: 5,
        result: [{ title: 'Project A' }],
      })

      const result = await getProjectsHandler({ fetchAll: false, offset: 0 }) as {
        content: Array<{ text: string }>
      }

      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.total).toBe(10)
      expect(parsed.result).toHaveLength(1)
    })

    it('passes offset and organizationIds correctly', async () => {
      mockApiClient.get.mockResolvedValue({
        total: 0,
        next: null,
        nextOffset: null,
        result: [],
      })

      await getProjectsHandler({
        fetchAll: false,
        offset: 10,
        organizationIds: ['org-x', 'org-y'],
      })

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/vcs/v2/me/projects',
        { offset: '10', organizationIds: 'org-x,org-y' }
      )
    })

    it('returns error tool result on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new ServerError('error', 500))

      const result = await getProjectsHandler({ fetchAll: false, offset: 0 }) as { isError: boolean }

      expect(result.isError).toBe(true)
    })
  })

  describe('issue-project handler', () => {
    it('sends POST request with responsibility only', async () => {
      mockApiClient.post.mockResolvedValue(undefined)

      const args = {
        responsibility: 'Lead developer',
        achievement: 'Shipped v2.0',
        title: 'Platform Rebuild',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        roles: 'Tech Lead',
        teamStructure: '5 engineers',
      }

      await issueProjectHandler(args)

      expect(mockApiClient.post).toHaveBeenCalledWith('/vcs/v2/me/projects', {
        responsibility: 'Lead developer',
      })
    })

    it('returns success message on successful issuance', async () => {
      mockApiClient.post.mockResolvedValue(undefined)

      const result = await issueProjectHandler({
        responsibility: 'Developer',
      }) as { content: Array<{ text: string }> }

      expect(result.content[0].text).toBe('Project certificate issued successfully.')
    })

    it('returns error tool result on API failure', async () => {
      mockApiClient.post.mockRejectedValue(new ServerError('failed', 500))

      const result = await issueProjectHandler({
        responsibility: 'Developer',
      }) as { isError: boolean }

      expect(result.isError).toBe(true)
    })
  })
})
