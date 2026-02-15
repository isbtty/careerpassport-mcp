import { z } from 'zod'
import { OrganizationFilterSchema, PaginationParamsSchema } from './common.js'

export const GetFeedbacksParamsSchema = PaginationParamsSchema.merge(OrganizationFilterSchema)

export const IssueFeedbackParamsSchema = z.object({
  quantitativeScores: z.array(z.object({
    category: z.string().describe('Evaluation category name'),
    score: z.number().describe('Numeric score for this category'),
  })).min(1)
    .describe('Quantitative evaluation scores (at least one required)'),
  strengthComment: z.string().min(1)
    .describe('Comment describing the user\'s strengths (required)'),
  potentialComment: z.string().optional()
    .describe('Comment describing areas for potential growth'),
  startDate: z.string().optional()
    .describe('Evaluation period start date (YYYY-MM-DD)'),
  endDate: z.string().optional()
    .describe('Evaluation period end date (YYYY-MM-DD)'),
})

export const FeedbackDtoSchema = z.object({
  issuerName: z.string(),
  url: z.string().nullable().optional(),
  startDate: z.string(),
  endDate: z.string(),
  issuedAt: z.string().nullable().optional(),
  quantitativeFeedbacks: z.string(),
  strengthComment: z.string(),
  potentialComment: z.string().nullable().optional(),
})
