import { sql } from './db'
import { extractTagNames, syncNoteTags } from './tags'
import type { Note, ExtractedTask, PaginatedNotes } from '@global-notes/shared'
import type { CreateNoteInput, UpdateNoteInput, ListNotesInput, SearchNotesInput } from '@global-notes/shared'

// ── Hydration ────────────────────────────────────────────────────────────────
// Takes raw DB rows and attaches tags, extracted tasks, and related note IDs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hydrate(rows: any[]): Promise<Note[]> {
  if (rows.length === 0) return []

  const ids = rows.map(r => r.id as string)

  // Batch-fetch tags
  const tagRows = await sql`
    SELECT nt.note_id, t.name
    FROM note_tags nt
    JOIN tags t ON t.id = nt.tag_id
    WHERE nt.note_id = ANY(${ids}::uuid[])
    ORDER BY t.name
  `
  const tagMap: Record<string, string[]> = {}
  for (const r of tagRows as { note_id: string; name: string }[]) {
    if (!tagMap[r.note_id]) tagMap[r.note_id] = []
    tagMap[r.note_id].push(r.name)
  }

  // Batch-fetch extracted tasks
  const taskRows = await sql`
    SELECT * FROM extracted_tasks
    WHERE note_id = ANY(${ids}::uuid[])
    ORDER BY created_at ASC
  `
  const taskMap: Record<string, ExtractedTask[]> = {}
  for (const r of taskRows as any[]) {
    if (!taskMap[r.note_id]) taskMap[r.note_id] = []
    taskMap[r.note_id].push({
      id:         r.id as string,
      note_id:    r.note_id as string,
      task_text:  r.task_text as string,
      completed:  r.completed as boolean,
      due_date:   r.due_date as string | null,
      created_at: (r.created_at as Date).toISOString(),
    })
  }

  // Batch-fetch related note IDs
  const relatedRows = await sql`
    SELECT note_id, related_note_id
    FROM related_notes
    WHERE note_id = ANY(${ids}::uuid[])
    ORDER BY similarity_score DESC
  `
  const relatedMap: Record<string, string[]> = {}
  for (const r of relatedRows as { note_id: string; related_note_id: string }[]) {
    if (!relatedMap[r.note_id]) relatedMap[r.note_id] = []
    relatedMap[r.note_id].push(r.related_note_id)
  }

  return rows.map(r => ({
    id:           r.id as string,
    content:      r.content as string,
    created_at:   (r.created_at as Date).toISOString(),
    updated_at:   (r.updated_at as Date).toISOString(),
    source:       r.source,
    source_url:   r.source_url ?? null,
    source_title: r.source_title ?? null,
    pinned:       r.pinned as boolean,
    // AI fields
    ai_category:     r.ai_category ?? null,
    ai_note_type:    r.ai_note_type ?? null,
    ai_project:      r.ai_project ?? null,
    ai_summary:      r.ai_summary ?? null,
    ai_keywords:     (r.ai_keywords as string[]) ?? [],
    ai_importance:   r.ai_importance != null ? parseFloat(r.ai_importance) : null,
    ai_urgency:      r.ai_urgency    != null ? parseFloat(r.ai_urgency)    : null,
    ai_confidence:   r.ai_confidence != null ? parseFloat(r.ai_confidence) : null,
    ai_processed_at: r.ai_processed_at ? (r.ai_processed_at as Date).toISOString() : null,
    // Relations
    tags:        tagMap[r.id as string]     ?? [],
    tasks:       taskMap[r.id as string]    ?? [],
    related_ids: relatedMap[r.id as string] ?? [],
  }))
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const { content, source, source_url, source_title } = input
  const rows = await sql`
    INSERT INTO notes (content, source, source_url, source_title)
    VALUES (${content}, ${source}, ${source_url ?? null}, ${source_title ?? null})
    RETURNING *
  `
  const note = rows[0]
  await syncNoteTags(note.id as string, extractTagNames(content))
  const [result] = await hydrate([note])
  return result
}

export async function listNotes(input: ListNotesInput): Promise<PaginatedNotes> {
  const { page, per_page, tag, source, pinned, project, note_type, min_urgency } = input
  const offset = (page - 1) * per_page

  // Nullable params — Neon sql tag doesn't support nested sql fragments,
  // so we use IS NULL guards to make every filter optional in a single query.
  const tagVal       = tag        ?? null
  const sourceVal    = source     ?? null
  const pinnedVal    = pinned     !== undefined ? pinned : null
  const projectVal   = project    ?? null
  const noteTypeVal  = note_type  ?? null
  const urgencyVal   = min_urgency !== undefined ? min_urgency : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[], countRow: any[]

  if (tagVal !== null) {
    rows = await sql`
      SELECT DISTINCT n.*
      FROM notes n
      JOIN note_tags nt ON nt.note_id = n.id
      JOIN tags t ON t.id = nt.tag_id
      WHERE t.name = ${tagVal}
        AND (${sourceVal}::text    IS NULL OR n.source       = ${sourceVal})
        AND (${pinnedVal}::boolean IS NULL OR n.pinned       = ${pinnedVal})
        AND (${projectVal}::text   IS NULL OR n.ai_project   = ${projectVal})
        AND (${noteTypeVal}::text  IS NULL OR n.ai_note_type = ${noteTypeVal})
        AND (${urgencyVal}::numeric IS NULL OR n.ai_urgency  >= ${urgencyVal})
      ORDER BY n.pinned DESC, n.created_at DESC
      LIMIT ${per_page} OFFSET ${offset}
    `
    countRow = await sql`
      SELECT COUNT(DISTINCT n.id)::text AS count
      FROM notes n
      JOIN note_tags nt ON nt.note_id = n.id
      JOIN tags t ON t.id = nt.tag_id
      WHERE t.name = ${tagVal}
        AND (${sourceVal}::text    IS NULL OR n.source       = ${sourceVal})
        AND (${pinnedVal}::boolean IS NULL OR n.pinned       = ${pinnedVal})
        AND (${projectVal}::text   IS NULL OR n.ai_project   = ${projectVal})
        AND (${noteTypeVal}::text  IS NULL OR n.ai_note_type = ${noteTypeVal})
        AND (${urgencyVal}::numeric IS NULL OR n.ai_urgency  >= ${urgencyVal})
    `
  } else {
    rows = await sql`
      SELECT n.*
      FROM notes n
      WHERE TRUE
        AND (${sourceVal}::text    IS NULL OR n.source       = ${sourceVal})
        AND (${pinnedVal}::boolean IS NULL OR n.pinned       = ${pinnedVal})
        AND (${projectVal}::text   IS NULL OR n.ai_project   = ${projectVal})
        AND (${noteTypeVal}::text  IS NULL OR n.ai_note_type = ${noteTypeVal})
        AND (${urgencyVal}::numeric IS NULL OR n.ai_urgency  >= ${urgencyVal})
      ORDER BY n.pinned DESC, n.created_at DESC
      LIMIT ${per_page} OFFSET ${offset}
    `
    countRow = await sql`
      SELECT COUNT(*)::text AS count
      FROM notes n
      WHERE TRUE
        AND (${sourceVal}::text    IS NULL OR n.source       = ${sourceVal})
        AND (${pinnedVal}::boolean IS NULL OR n.pinned       = ${pinnedVal})
        AND (${projectVal}::text   IS NULL OR n.ai_project   = ${projectVal})
        AND (${noteTypeVal}::text  IS NULL OR n.ai_note_type = ${noteTypeVal})
        AND (${urgencyVal}::numeric IS NULL OR n.ai_urgency  >= ${urgencyVal})
    `
  }

  const total = parseInt(countRow[0].count, 10)
  const notes = await hydrate(rows)
  return { notes, total, page, per_page, has_more: offset + notes.length < total }
}

export async function searchNotes(input: SearchNotesInput): Promise<PaginatedNotes> {
  const { q, page, per_page } = input
  const offset = (page - 1) * per_page

  const rows = await sql`
    SELECT n.*, ts_rank(n.search_vec, plainto_tsquery('english', ${q})) AS rank
    FROM notes n
    WHERE n.search_vec @@ plainto_tsquery('english', ${q})
    ORDER BY rank DESC, n.created_at DESC
    LIMIT ${per_page} OFFSET ${offset}
  `
  const countRow = await sql`
    SELECT COUNT(*)::text AS count FROM notes
    WHERE search_vec @@ plainto_tsquery('english', ${q})
  `

  const total = parseInt(countRow[0].count, 10)
  const notes = await hydrate(rows)
  return { notes, total, page, per_page, has_more: offset + notes.length < total }
}

export async function getNote(id: string): Promise<Note | null> {
  const rows = await sql`SELECT * FROM notes WHERE id = ${id}`
  if (rows.length === 0) return null
  const [note] = await hydrate([rows[0]])
  return note
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note | null> {
  const existing = await getNote(id)
  if (!existing) return null

  const content = input.content ?? existing.content
  const pinned  = input.pinned  ?? existing.pinned

  const rows = await sql`
    UPDATE notes SET content = ${content}, pinned = ${pinned}
    WHERE id = ${id}
    RETURNING *
  `

  if (input.content !== undefined) {
    await syncNoteTags(id, extractTagNames(content))
  }

  const [note] = await hydrate([rows[0]])
  return note
}

export async function deleteNote(id: string): Promise<boolean> {
  const result = await sql`DELETE FROM notes WHERE id = ${id} RETURNING id`
  return result.length > 0
}

export async function getAllNotes(): Promise<Note[]> {
  const rows = await sql`SELECT * FROM notes ORDER BY created_at DESC`
  return hydrate(rows)
}
