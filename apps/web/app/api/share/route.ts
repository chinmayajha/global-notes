import { NextRequest, NextResponse } from 'next/server'
import { createNote } from '@/lib/notes'

// PWA Web Share Target — receives shared content from mobile browsers.
// This route is intentionally unauthenticated at the route level;
// in production add a shared secret or cookie check if needed.
export async function POST(req: NextRequest) {
  let title = '', text = '', url = ''

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData()
    title = (form.get('title') as string) ?? ''
    text  = (form.get('text')  as string) ?? ''
    url   = (form.get('url')   as string) ?? ''
  } else if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    title = body.title ?? ''
    text  = body.text  ?? ''
    url   = body.url   ?? ''
  }

  const parts = [text, title, url].filter(Boolean)
  const content = parts.join('\n').trim()

  if (!content) {
    return NextResponse.redirect(new URL('/?share=empty', req.url))
  }

  await createNote({
    content,
    source: 'share',
    source_url: url || null,
    source_title: title || null,
  })

  return NextResponse.redirect(new URL('/?share=ok', req.url))
}
