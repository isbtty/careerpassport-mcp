import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../api/client.js'
import { toToolResult } from '../errors/handler.js'

export function registerRagTools(
  server: McpServer,
  apiClient: ApiClient
): void {
  server.tool(
    'rag-retrieval',
    "Search Career Passport's RAG corpus for relevant content. Returns matching contexts with relevance scores.",
    {
      ragCorpusId: z.string().min(1)
        .describe('The ID of the RAG corpus to search'),
      query: z.string().min(1)
        .describe('The search query'),
    },
    async (args) => {
      try {
        const response = await apiClient.post<unknown>(
          '/vcs/v2/contents/retrieval',
          { ragCorpusId: args.ragCorpusId, query: args.query }
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
    'rag-generation',
    "Generate content using Career Passport's RAG system. Generates contextual text grounded in the user's career data.",
    {
      ragCorpusId: z.string().min(1)
        .describe('The ID of the RAG corpus to use for generation'),
      query: z.string().min(1)
        .describe('The query with subject for content generation'),
    },
    async (args) => {
      try {
        const response = await apiClient.post<unknown>(
          '/vcs/v2/contents/generation',
          { ragCorpusId: args.ragCorpusId, query: args.query }
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
