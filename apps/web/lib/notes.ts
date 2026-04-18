import { sql } from './db'
import { extractTagNames, syncNoteTags } from './tags'
import type { Note, PaginatedNotes } from '@global-notes/shared'
import type { CreateNoteInput, UpdateNoteInput, ListNotesInput, SearchNotesInput } from '@global-notes/shared'

// Fetch a note row and attach its tags
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function attachTags(rows: any[]): Promise<Note[]> {
  if (rows.length === 0) return []

  const ids = rows.map(r => r.id as string)
  const tagRows = await sql`
    SELECT nt.note_id, t.name
    FROM note_tags nt
    JOIN tags t ON t.id = nt.tag_id
    WHERE nt.note_id = ANY(${ids}::uuid[])
    ORDER BY t.name
  `

  const tagMap: Record<string, string[]> = {}
  for (const row of tagRows as { note_id: string; name: string }[]) {
    if (!tagMap[row.note_id]) tagMap[row.note_id] = []
    tagMap[row.note_id].push(row.name)
  }

  return rows.map(r => ({
    ...(r as Omit<Note, 'tags'>),
    created_at: (r.created_at as Date).toISOString(),
    updated_at: (r.updated_at as Date).toISOString(),
    tags: tagMap[r.id as string] ?? [],
  }))
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const { content, source, source_url, source_title } = input

  const rows = await sql`
    INSERT INTO notes (content, source, source_url, source_title)
    VALUES (${content}, ${source}, ${source_url ?? null}, ${source_title ?? null})
    RETURNING *
  `

  const note = rows[0] as Record<string, unknown>
  const tagNames = extractTagNames(content)
  await syncNoteTags(note.id as string, tagNames)

  const [result] = await attachTags([note])
  return result
}

export async function listNotes(input: ListNotesInput): Promise<PaginatedNotes> {
  const { page, per_page, tag, source, pinned } = input
  const offset = (page - 1) * per_page

  // Build dynamic WHERE conditions
  const conditions: string[] = []
  if (source) conditions.push(`n.source = '${source}'`)
  if (pinned !== undefined) conditions.push(`n.pinned = ${pinned}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let countRow: any[]

  if (tag) {
    rows = await sql`
      SELECT DISTINCT n.*
      FROM notes n
      JOIN note_tags nt ON nt.note_id = n.id
      JOIN tags t ON t.id = nt.tag_id
      WHERE t.name = ${tag}
      ORDER BY n.pinned DESC, n.created_at DESC
      LIMIT ${per_page} OFFSET ${offset}
    `
    countRow = await sql`
      SELECT COUNT(DISTINCT n.id)::text AS count
      FROM notes n
      JOIN note_tags nt ON nt.note_id = n.id
      JOIN tags t ON t.id = nt.tag_id
      WHERE t.name = ${tag}
    `
  } else if (source && pinned !== undefined) {
    rows = await sql`
      SELECT n.*
      FROM notes n
      WHERE n.source = ${source} AND n.pinned = ${pinned}
      ORDER BY n.pinned DESC, n.created_at DESC
      LIMIT ${per_page} OFFSET ${offset}
    `
    countRow = await sql`
      SELECT COUNT(*)::text AS count FROM notes WHERE source = ${source} AND pinned = ${pinned}
    `
  } else if (source) {
    rows = await sql`
      SELECT n.* FROM notes n WHERE n.source = ${source}
      ORDER BY n.pinned DESC, n.created_at DESC
      LIMIT ${per_page} OFFSET ${offset}
    `
    countRow = await sql`
      SELECT COUNT(*)::text AS count FROM notes WHERE source = ${source}
    `
  } else if (pinned !== undefined) {
    rows = await sql`
      SELECT n.* FROM notes n WHERE n.pinned = ${pinned}
      ORDER BY n.pinned DESC, n.created_at DESC
      LIMIT ${per_page} OFFSET ${offset}
    `
    countRow = await sql`
      SELECT COUNT(*)::text AS count FROM notes WHERE pinned = ${pinned}
    `
  } else {
    rows = await sql`
      SELECT n.* FROM notes n
      ORDER BY n.pinned DESC, n.created_at DESC
      LIMIT ${per_page} OFFSET ${offset}
    `
    countRow = await sql`
      SELECT COUNT(*)::text AS count FROM notes
    `
  }

  const total = parseInt(countRow[0].count, 10)
  const notes = await attachTags(rows)

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
    SELECT COUNT(*)::text AS count
    FROM notes
    WHERE search_vec @@ plainto_tsquery('english', ${q})
  `

  const total = parseInt(countRow[0].count, 10)
  const notes = await attachTags(rows)

  return { notes, total, page, per_page, has_more: offset + notes.length < total }
}

export async function getNote(id: string): Promise<Note | null> {
  const rows = await sql`SELECT * FROM notes WHERE id = ${id}`
  if (rows.length === 0) return null
  const [note] = await attachTags([rows[0] as Record<string, unknown>])
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
    const tagNames = extractTagNames(content)
    await syncNoteTags(id, tagNames)
  }

  const [note] = await attachTags([rows[0] as Record<string, unknown>])
  return note
}

export async function deleteNote(id: string): Promise<boolean> {
  const result = await sql`DELETE FROM notes WHERE id = ${id} RETURNING id`
  return result.length > 0
}

export async function getAllNotes(): Promise<Note[]> {
  const rows = await sql`SELECT * FROM notes ORDER BY created_at DESC`
  return attachTags(rows as Record<string, unknown>[])
}
