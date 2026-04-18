import { sql } from './db'
import { createHash, randomBytes } from 'crypto'

export function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export async function createApiKey(name: string): Promise<{ id: string; key: string; name: string }> {
  const raw = `gn_${randomBytes(32).toString('hex')}`
  const key_hash = hashKey(raw)

  const rows = await sql`
    INSERT INTO api_keys (name, key_hash) VALUES (${name}, ${key_hash}) RETURNING id, name
  `
  return { id: rows[0].id as string, key: raw, name: rows[0].name as string }
}

export async function listApiKeys(): Promise<{ id: string; name: string; created_at: string; last_used: string | null }[]> {
  const rows = await sql`SELECT id, name, created_at, last_used FROM api_keys ORDER BY created_at DESC`
  return rows.map(r => ({
    id: r.id as string,
    name: r.name as string,
    created_at: (r.created_at as Date).toISOString(),
    last_used: r.last_used ? (r.last_used as Date).toISOString() : null,
  }))
}

export async function deleteApiKey(id: string): Promise<boolean> {
  const result = await sql`DELETE FROM api_keys WHERE id = ${id} RETURNING id`
  return result.length > 0
}

export async function validateApiKey(raw: string): Promise<boolean> {
  const key_hash = hashKey(raw)
  const rows = await sql`SELECT id FROM api_keys WHERE key_hash = ${key_hash}`
  if (rows.length === 0) return false

  // Update last_used without blocking
  sql`UPDATE api_keys SET last_used = NOW() WHERE key_hash = ${key_hash}`.catch(() => {})
  return true
}
