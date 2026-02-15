import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../api/client.js'
import { registerProjectTools } from './projects.js'
import { registerFeedbackTools } from './feedbacks.js'
import { registerGpaTools } from './gpas.js'
import { registerAwardTools } from './awards.js'
import { registerOrganizationTools } from './organizations.js'
import { registerRagTools } from './rag.js'

export function registerAllTools(
  server: McpServer,
  apiClient: ApiClient
): void {
  registerProjectTools(server, apiClient)
  registerFeedbackTools(server, apiClient)
  registerGpaTools(server, apiClient)
  registerAwardTools(server, apiClient)
  registerOrganizationTools(server, apiClient)
  registerRagTools(server, apiClient)
}
