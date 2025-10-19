import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Exclude static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/logo.png') ||
    pathname.startsWith('/background.png') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if user has manually selected a language (stored in cookie)
  const userLangPreference = request.cookies.get('user-lang-preference')?.value

  if (userLangPreference) {
    // User has manually selected a language, respect their choice
    if (userLangPreference === 'en' && !pathname.startsWith('/en')) {
      return NextResponse.redirect(new URL(`/en${pathname}`, request.url))
    }
    if (userLangPreference === 'ko' && pathname.startsWith('/en')) {
      const newPath = pathname.replace(/^\/en/, '') || '/'
      return NextResponse.redirect(new URL(newPath, request.url))
    }
    return NextResponse.next()
  }

  // Auto-detect user's country/language
  // Priority: 1) CF-IPCountry (Cloudflare/Netlify) -> 2) Accept-Language header

  // Check Cloudflare/Netlify country header
  const country = request.headers.get('cf-ipcountry') ||
                  request.headers.get('x-vercel-ip-country') ||
                  request.headers.get('cloudfront-viewer-country')

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || ''
  const isKoreanPreferred = acceptLanguage.toLowerCase().includes('ko')

  // Determine if user is from Korea
  // Default to Korea for local development (when country is null and no clear language preference)
  const isFromKorea = country === 'KR' || (country === null && (isKoreanPreferred || !acceptLanguage))

  // If user is NOT from Korea and accessing Korean pages, redirect to English
  if (!isFromKorea && !pathname.startsWith('/en')) {
    // Redirect to English version
    const url = new URL(`/en${pathname}`, request.url)
    return NextResponse.redirect(url)
  }

  // If user IS from Korea and accessing English pages, redirect to Korean
  if (isFromKorea && pathname.startsWith('/en')) {
    const newPath = pathname.replace(/^\/en/, '') || '/'
    const url = new URL(newPath, request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
