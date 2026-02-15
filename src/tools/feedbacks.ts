import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../api/client.js'
import type { PaginatedResponse } from '../api/types.js'
import { fetchAllPages } from '../api/pagination.js'
import { toToolResult } from '../errors/handler.js'

export function registerFeedbackTools(
  server: McpServer,
  apiClient: ApiClient
): void {
  server.tool(
    'get-feedbacks',
    "Retrieve the authenticated user's feedback credentials (performance evaluations with quantitative scores and qualitative comments) from Career Passport.",
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
              '/vcs/v2/me/feedbacks',
              { offset: String(offset), ...orgParams }
            )
          )
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ total, feedbacks: items }, null, 2),
            }],
          }
        }

        const response = await apiClient.get<PaginatedResponse<unknown>>(
          '/vcs/v2/me/feedbacks',
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
    'issue-feedback',
    "Issue a new feedback certificate (performance evaluation credential) to the authenticated user's Career Passport.",
    {
      quantitativeScores: z.array(z.object({
        category: z.string().describe('Evaluation category name'),
        score: z.number().describe('Numeric score for this category'),
      })).min(1)
        .describe('Quantitative evaluation scores (at least one required)'),
      strengthComment: z.string().min(1)
        .describe("Comment describing the user's strengths (required)"),
      potentialComment: z.string().optional()
        .describe('Comment describing areas for potential growth'),
      startDate: z.string().optional()
        .describe('Evaluation period start date (YYYY-MM-DD)'),
      endDate: z.string().optional()
        .describe('Evaluation period end date (YYYY-MM-DD)'),
    },
    async (args) => {
      try {
        await apiClient.post('/vcs/v2/me/feedbacks', args)
        return {
          content: [{
            type: 'text' as const,
            text: 'Feedback certificate issued successfully.',
          }],
        }
      } catch (error) {
        return toToolResult(error)
      }
    }
  )
}
