import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createNote, listNotes, searchNotes } from '@/lib/notes'
import { processNote } from '@/lib/ai/pipeline'
import { CreateNoteSchema, ListNotesSchema, SearchNotesSchema } from '@global-notes/shared'

export async function POST(req: NextRequest) {
  if (!await requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateNoteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const note = await createNote(parsed.data)

  // AI processing fires after the response is sent — never blocks note creation
  after(() => processNote(note.id, note.content))

  return NextResponse.json(note, { status: 201 })
}

export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')

  if (q) {
    const parsed = SearchNotesSchema.safeParse({ q, ...Object.fromEntries(searchParams) })
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const result = await searchNotes(parsed.data)
    return NextResponse.json(result)
  }

  const parsed = ListNotesSchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const result = await listNotes(parsed.data)
  return NextResponse.json(result)
}
