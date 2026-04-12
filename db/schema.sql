-- Enable pgvector extension (run once on Neon: CREATE EXTENSION IF NOT EXISTS vector;)
-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── notes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- source: web | cli | extension | desktop | share | api
  source       TEXT        NOT NULL DEFAULT 'web',
  source_url   TEXT,
  source_title TEXT,
  pinned       BOOLEAN     NOT NULL DEFAULT FALSE,
  -- stub for Phase 3 semantic search — kept NULL until embeddings are generated
  embedding    vector(1536),
  search_vec   TSVECTOR
);

-- ─── tags ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- ─── note_tags ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_tags (
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- ─── api_keys ─────────────────────────────────────────────────────────────────
-- Long-lived keys for CLI and browser extension access.
CREATE TABLE IF NOT EXISTS api_keys (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,                   -- e.g. "CLI", "Extension"
  key_hash   TEXT        NOT NULL UNIQUE,            -- SHA-256 of the raw key
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used  TIMESTAMPTZ
);

-- ─── Full-text search ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS notes_search_idx ON notes USING GIN(search_vec);

CREATE OR REPLACE FUNCTION notes_search_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vec := to_tsvector('english',
    COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.source_title, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_search_trigger ON notes;
CREATE TRIGGER notes_search_trigger
  BEFORE INSERT OR UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION notes_search_update();

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_updated_at ON notes;
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS notes_pinned_idx     ON notes(pinned) WHERE pinned = TRUE;
CREATE INDEX IF NOT EXISTS note_tags_tag_idx    ON note_tags(tag_id);
