import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../api/client.js'
import { toToolResult } from '../errors/handler.js'

export function registerOrganizationTools(
  server: McpServer,
  apiClient: ApiClient
): void {
  server.tool(
    'get-organizations',
    "Retrieve the list of organizations the authenticated user belongs to in Career Passport. Organization IDs can be used to filter other endpoints.",
    {},
    async () => {
      try {
        const response = await apiClient.get<unknown[]>(
          '/vcs/v2/me/organizations'
        )

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ organizations: response }, null, 2),
          }],
        }
      } catch (error) {
        return toToolResult(error)
      }
    }
  )
}
