import { z } from 'zod'
import { OrganizationFilterSchema, PaginationParamsSchema } from './common.js'

export const GetGpasParamsSchema = PaginationParamsSchema.merge(OrganizationFilterSchema)

export const GpaDtoSchema = z.object({
  issuerName: z.string(),
  gpa: z.number(),
  maxGpa: z.number().nullable().optional(),
  semester: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
})
