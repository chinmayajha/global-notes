import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`
    SELECT ai_project AS name, COUNT(*)::int AS count
    FROM notes
    WHERE ai_project IS NOT NULL
    GROUP BY ai_project
    ORDER BY count DESC, ai_project ASC
  `

  return NextResponse.json(rows)
}
