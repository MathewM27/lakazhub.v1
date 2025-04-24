import { type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

// Add production URL constant
const PRODUCTION_URL = 'https://lakazhub.com';

export async function middleware(request: NextRequest) {
  // Check if we're on the production domain
  const isProduction = request.headers.get('host') === 'lakazhub.com';
  
  // Check if this is a redirect from authentication
  const url = new URL(request.url)
  const isAuthCallback = url.pathname === '/auth/callback' || 
                         url.searchParams.has('code') || 
                         url.hash.includes('access_token')
  
  // Allow auth callbacks to proceed without session checks
  if (isAuthCallback) {
    console.log('Auth callback detected, skipping session check');
    return await updateSession(request, true) // Pass true to skip checks
  }
  
  // For all other requests, process normally with production flag
  return await updateSession(request, false, isProduction);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}