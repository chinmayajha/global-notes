import { sql } from './db'

const TAG_REGEX = /#([a-zA-Z0-9_-]+)/g

export function extractTagNames(content: string): string[] {
  const matches = [...content.matchAll(TAG_REGEX)]
  const names = matches.map(m => m[1].toLowerCase())
  return [...new Set(names)]
}

export async function syncNoteTags(noteId: string, tagNames: string[]): Promise<void> {
  if (tagNames.length === 0) {
    await sql`DELETE FROM note_tags WHERE note_id = ${noteId}`
    await pruneOrphanedTags()
    return
  }

  // Upsert tags and get their IDs
  const tagRows = await sql`
    INSERT INTO tags (name)
    SELECT UNNEST(${tagNames}::text[])
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name
  `

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tagIds = (tagRows as any[]).map((r) => r.id as string)

  // Replace all note_tags for this note
  await sql`DELETE FROM note_tags WHERE note_id = ${noteId}`

  if (tagIds.length > 0) {
    await sql`
      INSERT INTO note_tags (note_id, tag_id)
      SELECT ${noteId}, UNNEST(${tagIds}::uuid[])
      ON CONFLICT DO NOTHING
    `
  }

  await pruneOrphanedTags()
}

async function pruneOrphanedTags(): Promise<void> {
  await sql`DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM note_tags)`
}

export async function deleteTag(name: string): Promise<boolean> {
  const result = await sql`DELETE FROM tags WHERE name = ${name} RETURNING id`
  return result.length > 0
}
