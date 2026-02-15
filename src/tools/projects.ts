import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../api/client.js'
import type { PaginatedResponse } from '../api/types.js'
import { fetchAllPages } from '../api/pagination.js'
import { toToolResult } from '../errors/handler.js'

export function registerProjectTools(
  server: McpServer,
  apiClient: ApiClient
): void {
  server.tool(
    'get-projects',
    "Retrieve the authenticated user's project credentials (work experience certificates) from Career Passport. Supports filtering by organization and automatic pagination.",
    {
      organizationIds: z.array(z.string()).max(20).optional()
        .describe('Filter projects by organization IDs (max 20)'),
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
              '/vcs/v2/me/projects',
              { offset: String(offset), ...orgParams }
            )
          )
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ total, projects: items }, null, 2),
            }],
          }
        }

        const response = await apiClient.get<PaginatedResponse<unknown>>(
          '/vcs/v2/me/projects',
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

  server.tool(
    'issue-project',
    'Issue a new project certificate (work experience credential) to the authenticated user\'s Career Passport. Requires details about the project.',
    {
      responsibility: z.string().min(1)
        .describe("The user's responsibility in the project (required)"),
      achievement: z.string().optional()
        .describe('Key achievements during the project'),
      title: z.string().optional()
        .describe('Project title'),
      startDate: z.string().optional()
        .describe('Project start date (YYYY-MM-DD)'),
      endDate: z.string().optional()
        .describe('Project end date (YYYY-MM-DD)'),
      roles: z.string().optional()
        .describe('Roles held during the project'),
      teamStructure: z.string().optional()
        .describe('Description of the team structure'),
    },
    async (args) => {
      try {
        await apiClient.post('/vcs/v2/me/projects', args)
        return {
          content: [{
            type: 'text' as const,
            text: 'Project certificate issued successfully.',
          }],
        }
      } catch (error) {
        return toToolResult(error)
      }
    }
  )
}
