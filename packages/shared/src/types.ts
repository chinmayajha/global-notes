export type NoteSource = 'web' | 'cli' | 'extension' | 'desktop' | 'share' | 'api'

export interface Note {
  id: string
  content: string
  created_at: string
  updated_at: string
  source: NoteSource
  source_url: string | null
  source_title: string | null
  pinned: boolean
  tags: string[]
}

export interface Tag {
  id: string
  name: string
  count: number
}

export interface ApiKey {
  id: string
  name: string
  created_at: string
  last_used: string | null
}

export interface PaginatedNotes {
  notes: Note[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}
