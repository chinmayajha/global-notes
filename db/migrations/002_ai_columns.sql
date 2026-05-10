-- Migration 002: AI memory system columns and tables

-- AI metadata columns on notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_category     TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_note_type    TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_project      TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_summary      TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_keywords     JSONB        NOT NULL DEFAULT '[]';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_importance   NUMERIC(3,2);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_urgency      NUMERIC(3,2);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_confidence   NUMERIC(3,2);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ;

-- Resize embedding column from 1536 to 768 (Gemini text-embedding-004)
-- Safe if column is currently all NULL
ALTER TABLE notes ALTER COLUMN embedding TYPE vector(768)
  USING CASE WHEN embedding IS NULL THEN NULL
             ELSE embedding::text::vector(768)
        END;

-- Extracted tasks (structured tasks pulled from note content)
CREATE TABLE IF NOT EXISTS extracted_tasks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    UUID        NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  task_text  TEXT        NOT NULL,
  completed  BOOLEAN     NOT NULL DEFAULT FALSE,
  due_date   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS extracted_tasks_note_idx ON extracted_tasks(note_id);
CREATE INDEX IF NOT EXISTS extracted_tasks_pending_idx ON extracted_tasks(completed) WHERE completed = FALSE;

-- Related notes (both directions stored for fast lookup)
CREATE TABLE IF NOT EXISTS related_notes (
  note_id          UUID        NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  related_note_id  UUID        NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  similarity_score NUMERIC(3,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (note_id, related_note_id),
  CHECK (note_id != related_note_id)
);
CREATE INDEX IF NOT EXISTS related_notes_reverse_idx ON related_notes(related_note_id);

-- Index for AI filtering queries
CREATE INDEX IF NOT EXISTS notes_ai_project_idx  ON notes(ai_project)   WHERE ai_project  IS NOT NULL;
CREATE INDEX IF NOT EXISTS notes_ai_urgency_idx  ON notes(ai_urgency)   WHERE ai_urgency  IS NOT NULL;
CREATE INDEX IF NOT EXISTS notes_ai_type_idx     ON notes(ai_note_type) WHERE ai_note_type IS NOT NULL;
