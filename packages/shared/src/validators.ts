import { z } from 'zod'

export const NoteSourceSchema = z.enum(['web', 'cli', 'extension', 'desktop', 'share', 'api'])

export const CreateNoteSchema = z.object({
  content:      z.string().min(1).max(50_000),
  source:       NoteSourceSchema.default('web'),
  source_url:   z.string().url().nullable().optional(),
  source_title: z.string().max(500).nullable().optional(),
})

export const UpdateNoteSchema = z.object({
  content: z.string().min(1).max(50_000).optional(),
  pinned:  z.boolean().optional(),
})

export const ListNotesSchema = z.object({
  page:    z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(25),
  tag:     z.string().optional(),
  source:  NoteSourceSchema.optional(),
  pinned:  z.coerce.boolean().optional(),
})

export const SearchNotesSchema = z.object({
  q:       z.string().min(1).max(500),
  page:    z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(25),
})

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>
export type ListNotesInput  = z.infer<typeof ListNotesSchema>
export type SearchNotesInput = z.infer<typeof SearchNotesSchema>
