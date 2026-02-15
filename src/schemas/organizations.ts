import { z } from 'zod'

export const OrganizationDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
})
