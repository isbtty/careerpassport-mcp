import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../api/client.js'
import type { PaginatedResponse } from '../api/types.js'
import { fetchAllPages } from '../api/pagination.js'
import { toToolResult } from '../errors/handler.js'

export function registerGpaTools(
  server: McpServer,
  apiClient: ApiClient
): void {
  server.tool(
    'get-gpas',
    "Retrieve the authenticated user's GPA credentials (academic performance records) from Career Passport.",
    {
      organizationIds: z.array(z.string()).max(20).optional()
        .describe('Filter by organization IDs (max 20)'),
      fetchAll: z.boolean().default(true)
        .describe('Automatically fetch all pages'),
      offset: z.number().int().min(0).default(0)
        .describe('Page offset (only used when fetchAll is false)'),
    },
    async (args) => {
      try {
        const orgParams: Record<string, string> = {}
        if (args.organizationIds) {
          orgParams.organizationIds = args.organizationIds.join(',')
        }

        if (args.fetchAll) {
          const { items, total } = await fetchAllPages((offset) =>
            apiClient.get<PaginatedResponse<unknown>>(
              '/vcs/v2/me/gpas',
              { offset: String(offset), ...orgParams }
            )
          )
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ total, gpas: items }, null, 2),
            }],
          }
        }

        const response = await apiClient.get<PaginatedResponse<unknown>>(
          '/vcs/v2/me/gpas',
          { offset: String(args.offset), ...orgParams }
        )

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(response, null, 2),
          }],
        }
      } catch (error) {
        return toToolResult(error)
      }
    }
  )
}
