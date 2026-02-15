import { describe, it, expect, vi } from 'vitest'
import { createServer } from '../../src/server.js'
import type { ApiClient } from '../../src/api/client.js'

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: vi.fn().mockImplementation(() => ({
      tool: vi.fn(),
    })),
  }
})

describe('createServer', () => {
  it('creates a McpServer with correct name and version', async () => {
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js')
    const mockApiClient = { get: vi.fn(), post: vi.fn() }

    createServer(mockApiClient as unknown as ApiClient)

    expect(McpServer).toHaveBeenCalledWith({
      name: 'careerpassport-mcp',
      version: '0.1.0',
    })
  })

  it('returns an McpServer instance', () => {
    const mockApiClient = { get: vi.fn(), post: vi.fn() }

    const server = createServer(mockApiClient as unknown as ApiClient)

    expect(server).toBeDefined()
    expect(server.tool).toBeDefined()
  })

  it('registers tools on the created server', () => {
    const mockApiClient = { get: vi.fn(), post: vi.fn() }

    const server = createServer(mockApiClient as unknown as ApiClient)

    expect(server.tool).toHaveBeenCalled()
  })
})
