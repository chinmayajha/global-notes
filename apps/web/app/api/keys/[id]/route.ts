import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { deleteApiKey } from '@/lib/api-keys'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const deleted = await deleteApiKey(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return new NextResponse(null, { status: 204 })
}
