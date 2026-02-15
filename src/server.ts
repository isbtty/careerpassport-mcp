import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from './api/client.js'
import { registerAllTools } from './tools/register.js'

export function createServer(apiClient: ApiClient): McpServer {
  const server = new McpServer({
    name: 'careerpassport-mcp',
    version: '0.1.0',
  })

  registerAllTools(server, apiClient)

  return server
}
