import { z } from 'zod'
import { OrganizationFilterSchema, PaginationParamsSchema } from './common.js'

export const GetProjectsParamsSchema = PaginationParamsSchema.merge(OrganizationFilterSchema)

export const IssueProjectParamsSchema = z.object({
  responsibility: z.string().min(1)
    .describe('The user\'s responsibility in the project (required)'),
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
})

export const ProjectDtoSchema = z.object({
  issuerName: z.string(),
  title: z.string().nullable().optional(),
  startDate: z.string(),
  endDate: z.string(),
  grantedAt: z.string().nullable().optional(),
  responsibility: z.string(),
  achievement: z.string(),
  roles: z.string(),
  teamStructure: z.string(),
})
