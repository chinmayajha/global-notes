import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createApiKey, listApiKeys } from '@/lib/api-keys'
import { z } from 'zod'

const CreateKeySchema = z.object({ name: z.string().min(1).max(100) })

export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const keys = await listApiKeys()
  return NextResponse.json(keys)
}

export async function POST(req: NextRequest) {
  if (!await requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateKeySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const result = await createApiKey(parsed.data.name)
  // Return the raw key only once — it cannot be retrieved again
  return NextResponse.json(result, { status: 201 })
}
