import { z } from 'zod'

export const PaginationParamsSchema = z.object({
  fetchAll: z.boolean().default(true)
    .describe('When true, automatically fetches all pages. When false, returns first page only.'),
  offset: z.number().int().min(0).default(0)
    .describe('Page offset (0-based). Only used when fetchAll is false.'),
})

export const OrganizationFilterSchema = z.object({
  organizationIds: z.array(z.string()).max(20).optional()
    .describe('Filter by organization IDs (max 20)'),
})
