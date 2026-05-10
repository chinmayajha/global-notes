import { z } from 'zod'

export const GeminiResponseSchema = z.object({
  category:         z.string(),
  note_type:        z.string(),
  project:          z.string().nullable(),
  summary:          z.string(),
  keywords:         z.array(z.string()),
  tasks:            z.array(z.object({
    text:     z.string(),
    due_date: z.string().nullable(),
  })),
  importance_score: z.number().min(0).max(1),
  urgency_score:    z.number().min(0).max(1),
  confidence:       z.number().min(0).max(1),
})

export type GeminiAnalysis = z.infer<typeof GeminiResponseSchema>
