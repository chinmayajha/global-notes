export type NoteSource = 'web' | 'cli' | 'extension' | 'desktop' | 'share' | 'api'

export interface ExtractedTask {
  id: string
  note_id: string
  task_text: string
  completed: boolean
  due_date: string | null
  created_at: string
}

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
  // AI memory fields (null until processed)
  ai_category:     string | null
  ai_note_type:    string | null
  ai_project:      string | null
  ai_summary:      string | null
  ai_keywords:     string[]
  ai_importance:   number | null
  ai_urgency:      number | null
  ai_confidence:   number | null
  ai_processed_at: string | null
  // Hydrated relations
  tasks:       ExtractedTask[]
  related_ids: string[]
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
