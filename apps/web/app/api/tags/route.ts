import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`
    SELECT t.id, t.name, COUNT(nt.note_id)::int AS count
    FROM tags t
    LEFT JOIN note_tags nt ON nt.tag_id = t.id
    GROUP BY t.id, t.name
    ORDER BY count DESC, t.name ASC
  `

  return NextResponse.json(rows)
}
