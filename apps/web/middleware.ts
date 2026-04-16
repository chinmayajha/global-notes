import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/share',
])

export default clerkMiddleware(async (auth, req) => {
  // API routes with a Bearer token are authenticated by requireAuth() in each route handler.
  // Skip Clerk's browser-based protection so CLI/extension/desktop keys work without cookies.
  const authHeader = req.headers.get('authorization') ?? ''
  if (req.nextUrl.pathname.startsWith('/api/') && authHeader.startsWith('Bearer ')) {
    return
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
}
