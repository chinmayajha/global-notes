import { auth } from '@clerk/nextjs/server'
import { validateApiKey } from './api-keys'
import { NextRequest } from 'next/server'

export async function requireAuth(req: NextRequest): Promise<boolean> {
  // Prefer Clerk session auth (web UI)
  const { userId } = await auth()
  if (userId) return true

  // Fall back to API key (CLI, extension, desktop)
  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) {
    const raw = authHeader.slice(7).trim()
    return validateApiKey(raw)
  }

  return false
}
