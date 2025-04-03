import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'
import { createClient } from './utils/supabase/server'

export async function middleware(request: NextRequest) {
  // Check if this is a redirect from authentication
  const url = new URL(request.url)
  const isAuthCallback = url.pathname === '/auth/callback' || 
                         url.searchParams.has('code') || 
                         url.hash.includes('access_token')
  
  // Allow auth callbacks to proceed without session checks
  if (isAuthCallback) {
    console.log('Auth callback detected, skipping session check')
    return await updateSession(request, true) // Pass true to skip checks
  }
  
  // Check if this is a dashboard route
  const isDashboardRoute = url.pathname.startsWith('/dashboard')
  
  if (isDashboardRoute) {
    // Create a response that we'll modify if needed
    const response = NextResponse.next()
    
    try {
      // Create Supabase client
      const supabase = await createClient()
      
      // Get the user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // No session, redirect to login
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Get user metadata
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // No user, redirect to login
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Get user role from metadata
      const userRole = user.user_metadata?.user_role
      
      if (!userRole) {
        // No role, redirect to login
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Check if user is accessing the correct dashboard for their role
      const isTenantRoute = url.pathname.startsWith('/dashboard/tenant')
      const isLandlordRoute = url.pathname.startsWith('/dashboard/landlord')
      const isAdminRoute = url.pathname.startsWith('/dashboard/admin')
      
      if (
        (userRole === 'tenant' && !isTenantRoute) ||
        (userRole === 'landlord' && !isLandlordRoute) ||
        (userRole === 'admin' && !isAdminRoute)
      ) {
        // Redirect to the correct dashboard based on role
        const redirectPath = userRole === 'tenant' 
          ? '/dashboard/tenant' 
          : userRole === 'landlord' 
            ? '/dashboard/landlord' 
            : '/dashboard/admin'
        
        const redirectUrl = new URL(redirectPath, request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // User is accessing the correct dashboard, proceed
      return response
    } catch (error) {
      console.error('Error in dashboard middleware:', error)
      // On error, redirect to login
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // For all other requests, process normally
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