import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../api/client.js'
import { toToolResult } from '../errors/handler.js'

export function registerAwardTools(
  server: McpServer,
  apiClient: ApiClient
): void {
  server.tool(
    'get-awards',
    "Retrieve the authenticated user's awards and recognition badges from Career Passport.",
    {
      organizationIds: z.array(z.string()).max(20).optional()
        .describe('Filter by organization IDs (max 20)'),
    },
    async (args) => {
      try {
        const orgParams: Record<string, string> = {}
        if (args.organizationIds) {
          orgParams.organizationIds = args.organizationIds.join(',')
        }

        const response = await apiClient.get<unknown[]>(
          '/vcs/v2/me/awards',
          orgParams
        )

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ awards: response }, null, 2),
          }],
        }
      } catch (error) {
        return toToolResult(error)
      }
    }
  )
}
