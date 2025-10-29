import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ensure proper routing for admin pages
  if (pathname.startsWith('/admin') && !pathname.includes('.') && !pathname.includes('api')) {
    // Allow all admin routes to be served normally
    return NextResponse.next()
  }

  // For root path, redirect to data sources as the default page
  if (pathname === '/' || pathname === '') {
    return NextResponse.redirect(new URL('/admin/data-sources', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}