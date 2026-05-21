import { NextResponse } from 'next/server'

export function middleware(request) {
  // Note: client-side persists auth in localStorage via zustand.
  // For MVP we let the client-side AuthGuard handle redirects.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
