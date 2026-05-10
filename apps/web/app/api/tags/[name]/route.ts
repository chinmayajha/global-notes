import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { deleteTag } from '@/lib/tags'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  if (!await requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await params
  const deleted = await deleteTag(decodeURIComponent(name))
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return new NextResponse(null, { status: 204 })
}
