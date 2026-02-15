import { describe, it, expect, vi } from 'vitest'
import { registerAllTools } from '../../../src/tools/register.js'
import type { ApiClient } from '../../../src/api/client.js'

describe('registerAllTools', () => {
  it('registers all 9 tools on the server', () => {
    const mockServer = { tool: vi.fn() }
    const mockApiClient = { get: vi.fn(), post: vi.fn() }

    registerAllTools(
      mockServer as unknown as Parameters<typeof registerAllTools>[0],
      mockApiClient as unknown as ApiClient
    )

    const registeredTools = mockServer.tool.mock.calls.map((call: unknown[]) => call[0])

    expect(registeredTools).toContain('get-projects')
    expect(registeredTools).toContain('issue-project')
    expect(registeredTools).toContain('get-feedbacks')
    expect(registeredTools).toContain('issue-feedback')
    expect(registeredTools).toContain('get-gpas')
    expect(registeredTools).toContain('get-awards')
    expect(registeredTools).toContain('get-organizations')
    expect(registeredTools).toContain('rag-retrieval')
    expect(registeredTools).toContain('rag-generation')

    expect(mockServer.tool).toHaveBeenCalledTimes(9)
  })
})
