import { z } from 'zod'
import { OrganizationFilterSchema } from './common.js'

export const GetAwardsParamsSchema = OrganizationFilterSchema

export const AwardDtoSchema = z.object({
  issuerName: z.string(),
  title: z.string(),
  date: z.string(),
  detail: z.string().nullable().optional(),
})
