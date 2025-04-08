import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'
import { createClient } from './utils/supabase/server'
import { rateLimiter } from './utils/rate-limiter'
import * as Sentry from '@sentry/nextjs'

// Safe logging function that only logs in development
const log = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    if (data) {
      console.log(`[MIDDLEWARE] ${message}`, data);
    } else {
      console.log(`[MIDDLEWARE] ${message}`);
    }
  }
}

// Safe error logging function that only logs in development
const logError = (message: string, error?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    if (error) {
      console.error(`[MIDDLEWARE] ${message}`, error);
    } else {
      console.error(`[MIDDLEWARE] ${message}`);
    }
  }
}

export async function middleware(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown-ip'
    
    // Check if this is a redirect from authentication
    const url = new URL(request.url)
    const isAuthCallback = url.pathname === '/auth/callback' || 
                          url.searchParams.has('code') || 
                          url.hash.includes('access_token')
  
  log('Request path:', url.pathname);
  log('Is auth callback:', isAuthCallback);
  
  // Check if this is a sign-in attempt
  const isSignInAttempt = url.pathname === '/auth/signin' || 
                         url.pathname === '/auth/login' ||
                         url.pathname.includes('/api/auth');
  
  // Apply rate limiting for authentication attempts
  if (isSignInAttempt) {
    log('Auth attempt detected, checking rate limits');
    const { isLimited, resetTime } = rateLimiter.checkLimit(ip);
    
    if (isLimited) {
      log('Rate limit exceeded for IP:', ip);
      
      // Track rate limit in Sentry
      Sentry.captureMessage('Authentication rate limit exceeded', {
        level: 'warning',
        tags: { ip },
        extra: { resetTime: resetTime?.toISOString() }
      });
      
      // Return 429 Too Many Requests with information about when to retry
      return new NextResponse(JSON.stringify({
        error: 'Too many authentication attempts',
        message: 'Please try again later',
        retryAfter: resetTime
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString() : '900'
        }
      });
    }
  }
  
  // Allow auth callbacks to proceed without session checks
  if (isAuthCallback) {
    log('Auth callback detected, skipping session check');
    
    // Reset rate limit after successful authentication
    rateLimiter.resetLimit(ip);
    
    return await updateSession(request, true); // Pass true to skip checks
  }
  
  // Check if this is a dashboard route
  const isDashboardRoute = url.pathname.startsWith('/tenant-dashboard') || 
                         url.pathname.startsWith('/landlord-dashboard') || 
                         url.pathname.startsWith('/admin-dashboard')
  
  log('Is dashboard route:', isDashboardRoute);
  
  if (isDashboardRoute) {
    // Create a response that we'll modify if needed
    const response = NextResponse.next()
    
    try {
      log('Checking authentication for dashboard route');
      // Create Supabase client
      const supabase = await createClient()
      
      // Get the user session
      const { data: { session } } = await supabase.auth.getSession()
      log('Session exists:', !!session);
      
      if (!session) {
        // No session, redirect to login
        log('No session found, redirecting to login');
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Get user metadata
      const { data: { user } } = await supabase.auth.getUser()
      log('User exists:', !!user);
      log('User ID:', user?.id);
      
      if (!user) {
        // No user, redirect to login
        log('No user found, redirecting to login');
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Add this to middleware.ts after fetching user from Supabase
      if (user && user.user_metadata?.user_role) {
        // Check if profile exists or update it if there's a mismatch
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single();
          
        if (!profile || profile.user_role !== user.user_metadata.user_role) {
          await supabase.from('profiles').upsert({
            id: user.id,
            full_name: user.user_metadata.full_name || user.user_metadata.name || 'Unknown',
            email_address: user.email || '',
            user_role: user.user_metadata.user_role
          });
        }
      }
      
      // Get user role from metadata first
      const metadataRole = session.user.user_metadata?.user_role;
      log('User role from session metadata:', metadataRole);
      
      // IMPORTANT: Verify role from database (more secure than relying on metadata)
      let userRole = metadataRole;
      try {
        // Get user profile from database to verify role
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', session.user.id)
          .single();
        
        if (profile && profile.user_role) {
          // Use the database role as the source of truth
          userRole = profile.user_role;
          log('User role from database:', userRole);
          
          // If metadata role doesn't match database role, update metadata
          // This ensures consistency between metadata and database
          if (metadataRole !== userRole) {
            log('Updating metadata role to match database role');
            await supabase.auth.updateUser({
              data: { user_role: userRole }
            });
          }
        } else {
          log('No profile or role found in database');
        }
      } catch (profileError) {
        logError('Error fetching user profile from database:', profileError);
        // Fall back to metadata role if database query fails
      }
      
      // Check if user is accessing the correct dashboard for their role
      const isTenantRoute = url.pathname.startsWith('/tenant-dashboard');
      const isLandlordRoute = url.pathname.startsWith('/landlord-dashboard');
      const isAdminRoute = url.pathname.startsWith('/admin-dashboard');
      
      log('Route types:', { isTenantRoute, isLandlordRoute, isAdminRoute });

      // Add an explicit check for landlords
      const isLandlord = userRole === 'landlord';
      if (isLandlord) {
        log('Landlord detected in middleware');
        
        // If landlord is accessing wrong routes, redirect to landlord dashboard
        if (!isLandlordRoute) {
          log('Landlord accessing non-landlord route, redirecting');
          const redirectUrl = new URL('/landlord-dashboard', request.url);
          return NextResponse.redirect(redirectUrl);
        }
      }
      
      log('User metadata:', user.user_metadata);
      
      if (!userRole) {
        // No role, redirect to login
        log('No user role found, redirecting to login');
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Make the role redirection logic more robust
      if (
        (userRole === 'tenant' && !isTenantRoute) ||
        (userRole === 'landlord' && !isLandlordRoute) ||
        (userRole === 'admin' && !isAdminRoute)
      ) {
        // Log more explicitly
        log(`User with role ${userRole} accessing wrong dashboard`);
        
        // Create a stronger landlord redirect
        const redirectPath = userRole === 'landlord' 
          ? '/landlord-dashboard' 
          : userRole === 'tenant'
            ? '/tenant-dashboard'
            : '/admin-dashboard';
        
        log('User accessing wrong dashboard, redirecting to:', redirectPath);
        const redirectUrl = new URL(redirectPath, request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // User is accessing the correct dashboard, proceed
      log('User authorized for this dashboard, proceeding');
      return response
    } catch (error) {
      logError('Error in dashboard middleware:', error)
      // On error, redirect to login
      log('Error occurred, redirecting to login');
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // For all other requests, process normally
  log('Processing non-dashboard route normally');
  return await updateSession(request)
  } catch (error) {
    // Log and report any middleware errors
    logError('Unhandled middleware error:', error);
    
    // Report to Sentry
    Sentry.captureException(error, {
      tags: {
        component: 'middleware'
      }
    });
    
    // Return a generic error for security
    return NextResponse.next();
  }
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