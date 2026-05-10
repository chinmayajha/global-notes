import { sql } from '../db'
import { analyzeNote, generateEmbedding } from './gemini'

export async function processNote(noteId: string, content: string): Promise<void> {
  if (!content || content.trim().length < 15) return

  // ── Step 1: Gemini analysis ──────────────────────────────────────────────
  let analysis = null
  try {
    analysis = await analyzeNote(content)
  } catch { /* silent */ }

  if (analysis) {
    // ── Step 2: Store AI metadata ──────────────────────────────────────────
    try {
      await sql`
        UPDATE notes SET
          ai_category     = ${analysis.category},
          ai_note_type    = ${analysis.note_type},
          ai_project      = ${analysis.project},
          ai_summary      = ${analysis.summary},
          ai_keywords     = ${JSON.stringify(analysis.keywords)},
          ai_importance   = ${analysis.importance_score},
          ai_urgency      = ${analysis.urgency_score},
          ai_confidence   = ${analysis.confidence},
          ai_processed_at = NOW()
        WHERE id = ${noteId}
      `
    } catch { /* silent */ }

    // ── Step 3: Sync extracted tasks ──────────────────────────────────────
    try {
      await sql`DELETE FROM extracted_tasks WHERE note_id = ${noteId}`
      if (analysis.tasks.length > 0) {
        for (const task of analysis.tasks) {
          await sql`
            INSERT INTO extracted_tasks (note_id, task_text, due_date)
            VALUES (${noteId}, ${task.text}, ${task.due_date ?? null})
          `
        }
      }
    } catch { /* silent */ }
  }

  // ── Step 4: Generate embedding ────────────────────────────────────────────
  let embedding: number[] | null = null
  try {
    embedding = await generateEmbedding(content)
  } catch { /* silent */ }

  if (embedding) {
    // ── Step 5: Store embedding ───────────────────────────────────────────
    try {
      await sql`UPDATE notes SET embedding = ${JSON.stringify(embedding)}::vector WHERE id = ${noteId}`
    } catch { /* silent */ }

    // ── Step 6: Find and store related notes ─────────────────────────────
    try {
      const related = await sql`
        SELECT id,
               1 - (embedding <=> ${JSON.stringify(embedding)}::vector) AS similarity
        FROM notes
        WHERE id != ${noteId}
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
        LIMIT 5
      `

      await sql`DELETE FROM related_notes WHERE note_id = ${noteId}`

      for (const r of related as { id: string; similarity: number }[]) {
        const score = parseFloat(String(r.similarity))
        if (score < 0.75) continue

        // Insert both directions so either note can find the other
        await sql`
          INSERT INTO related_notes (note_id, related_note_id, similarity_score)
          VALUES (${noteId}, ${r.id}, ${score})
          ON CONFLICT DO NOTHING
        `
        await sql`
          INSERT INTO related_notes (note_id, related_note_id, similarity_score)
          VALUES (${r.id}, ${noteId}, ${score})
          ON CONFLICT DO NOTHING
        `
      }
    } catch { /* silent */ }
  }
}
