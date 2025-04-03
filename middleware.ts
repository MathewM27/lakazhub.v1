import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'
import { createClient } from './utils/supabase/server'

export async function middleware(request: NextRequest) {
  // Check if this is a redirect from authentication
  const url = new URL(request.url)
  const isAuthCallback = url.pathname === '/auth/callback' || 
                         url.searchParams.has('code') || 
                         url.hash.includes('access_token')
  
  console.log('[MIDDLEWARE] Request path:', url.pathname);
  console.log('[MIDDLEWARE] Is auth callback:', isAuthCallback);
  
  // Allow auth callbacks to proceed without session checks
  if (isAuthCallback) {
    console.log('[MIDDLEWARE] Auth callback detected, skipping session check');
    return await updateSession(request, true); // Pass true to skip checks
  }
  
  // Check if this is a dashboard route
  const isDashboardRoute = url.pathname.startsWith('/tenant-dashboard') || 
                         url.pathname.startsWith('/landlord-dashboard') || 
                         url.pathname.startsWith('/admin-dashboard')
  
  console.log('[MIDDLEWARE] Is dashboard route:', isDashboardRoute);
  
  if (isDashboardRoute) {
    // Create a response that we'll modify if needed
    const response = NextResponse.next()
    
    try {
      console.log('[MIDDLEWARE] Checking authentication for dashboard route');
      // Create Supabase client
      const supabase = await createClient()
      
      // Get the user session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[MIDDLEWARE] Session exists:', !!session);
      
      if (!session) {
        // No session, redirect to login
        console.log('[MIDDLEWARE] No session found, redirecting to login');
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Get user metadata
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[MIDDLEWARE] User exists:', !!user);
      console.log('[MIDDLEWARE] User ID:', user?.id);
      
      if (!user) {
        // No user, redirect to login
        console.log('[MIDDLEWARE] No user found, redirecting to login');
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Get user role from metadata
      const userRole = user.user_metadata?.user_role;
      console.log('[MIDDLEWARE] User role:', userRole);
      console.log('[MIDDLEWARE] User metadata:', JSON.stringify(user.user_metadata));
      
      if (!userRole) {
        // No role, redirect to login
        console.log('[MIDDLEWARE] No user role found, redirecting to login');
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Check if user is accessing the correct dashboard for their role
      const isTenantRoute = url.pathname.startsWith('/tenant-dashboard')
      const isLandlordRoute = url.pathname.startsWith('/landlord-dashboard')
      const isAdminRoute = url.pathname.startsWith('/admin-dashboard')
      
      console.log('[MIDDLEWARE] Route types:', { isTenantRoute, isLandlordRoute, isAdminRoute });
      
      if (
        (userRole === 'tenant' && !isTenantRoute) ||
        (userRole === 'landlord' && !isLandlordRoute) ||
        (userRole === 'admin' && !isAdminRoute)
      ) {
        // Redirect to the correct dashboard based on role
        const redirectPath = userRole === 'tenant' 
          ? '/tenant-dashboard' 
          : userRole === 'landlord' 
            ? '/landlord-dashboard' 
            : '/admin-dashboard'
        
        console.log('[MIDDLEWARE] User accessing wrong dashboard, redirecting to:', redirectPath);
        const redirectUrl = new URL(redirectPath, request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // User is accessing the correct dashboard, proceed
      console.log('[MIDDLEWARE] User authorized for this dashboard, proceeding');
      return response
    } catch (error) {
      console.error('[MIDDLEWARE] Error in dashboard middleware:', error)
      // On error, redirect to login
      console.log('[MIDDLEWARE] Error occurred, redirecting to login');
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // For all other requests, process normally
  console.log('[MIDDLEWARE] Processing non-dashboard route normally');
  return await updateSession(request)
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