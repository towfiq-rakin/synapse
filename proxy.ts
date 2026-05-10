import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/sso-callback(.*)',
  '/u(.*)',
  '/share(.*)',
])

const isProtectedRoute = createRouteMatcher([
  '/notes(.*)',
  '/api/notes(.*)',
  '/api/folders(.*)',
  '/api/explorer(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname === '/') {
    const { userId } = await auth()

    if (userId) {
      const url = req.nextUrl.clone()
      url.pathname = '/notes'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  if (!isPublicRoute(req) && isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
