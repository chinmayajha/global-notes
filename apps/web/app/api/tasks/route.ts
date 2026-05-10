import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const completed = searchParams.get('completed')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  const rows = await sql`
    SELECT t.id, t.note_id, t.task_text, t.completed, t.due_date, t.created_at
    FROM extracted_tasks t
    JOIN notes n ON n.id = t.note_id
    WHERE (${completed === null} OR t.completed = ${completed === 'true'})
    ORDER BY t.created_at DESC
    LIMIT ${limit}
  `

  return NextResponse.json(rows)
}
