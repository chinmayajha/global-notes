import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getAllNotes } from '@/lib/notes'

export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notes = await getAllNotes()

  return new NextResponse(JSON.stringify(notes, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="global-notes-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
