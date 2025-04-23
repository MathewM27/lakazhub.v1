export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimiter } from '@/utils/rate-limiter'

// More efficient background logging with proper type
const logInBackground = (data: Record<string, unknown>) => {
  // Use queueMicrotask for lower overhead than Promise.resolve
  queueMicrotask(() => console.log(data));
};

// Pre-compute cache control headers to avoid object recreation on each request
const ERROR_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const SUCCESS_CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=30',
};

// Optimized redirect functions
const errorRedirect = (url: string) => NextResponse.redirect(url, { headers: ERROR_CACHE_HEADERS });
const successRedirect = (url: string) => NextResponse.redirect(url, { headers: SUCCESS_CACHE_HEADERS });

export async function GET(request: Request) {
  // Check if this is a redirect from authentication
  const url = new URL(request.url)
  const { searchParams, origin } = url;
  
  // Get necessary parameters at once
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const userRole = searchParams.get('user_role');
  
  // Apply rate limiting to auth callback - only check once we have the parameters
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown-ip';

  // Early error handling for better UX
  if (error) {
    const errorDescription = searchParams.get('error_description') || '';
    return errorRedirect(`${origin}/auth/auth-loading?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription)}`);
  }

  if (!code) {
    return errorRedirect(`${origin}/auth/auth-loading?error=no_code`);
  }
  
  // Use a more lenient rate limit check for callbacks
  if (ip !== 'unknown-ip') {
    const { isLimited } = rateLimiter.checkLimit(`callback_${ip}`);
    if (isLimited) {
      return errorRedirect(`${origin}/auth/auth-loading?error=too_many_requests`);
    }
  }
  
  // Initialize Supabase client once
  const supabase = await createClient();
  
  try {
    // Exchange code for session - critical path
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      // Log error in background but redirect immediately
      queueMicrotask(() => {
        logInBackground({
          type: 'session_error',
          error: sessionError.message,
          code: sessionError.status
        });
      });
      return errorRedirect(`${origin}/auth/auth-loading?error=${encodeURIComponent(sessionError.message)}`);
    }

    // Get session data - critical for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if we have a valid user session
    if (!session?.user) {
      return errorRedirect(`${origin}/auth/auth-loading?error=no_session`);
    }
    
    // Log success in background (non-blocking)
    queueMicrotask(() => {
      logInBackground({ type: 'auth_success', provider: session.user.app_metadata?.provider || 'unknown' });
    });
    
    // Update user metadata in background without blocking the redirect
    if (
      (session.user.app_metadata?.provider === 'google' || session.user.app_metadata?.provider === 'facebook')
      && userRole
    ) {
      queueMicrotask(async () => {
        try {
          const metadata = session.user.user_metadata || {};
          const firstName = metadata.given_name || 
                           (metadata.full_name ? metadata.full_name.split(' ')[0] : 'Unknown');
          const lastName = metadata.family_name || 
                          (metadata.full_name ? metadata.full_name.split(' ').slice(1).join(' ') : 'User');
          
          await supabase.auth.updateUser({
            data: {
              full_name: `${firstName} ${lastName}`,
              phone_number: '', 
              user_role: userRole === 'landlord' ? 'landlord' : 'tenant'
            }
          });
        } catch (updateError) {
          logInBackground({
            type: 'profile_update_error',
            error: String(updateError),
            userId: session.user.id
          });
        }
      });
    }

    // Determine redirect path
    const dashboardPath = 
      userRole === 'landlord' ? '/landlord-dashboard' :
      userRole === 'admin' ? '/admin-dashboard' : 
      '/tenant-dashboard';
    
    // Redirect to auth-loading page which will show UI while session is being established
    // Pass user role as query param for smoother transition
    return successRedirect(`${origin}/auth/auth-loading?redirect=${encodeURIComponent(dashboardPath)}&user_role=${userRole || 'tenant'}`);
    
  } catch (error) {
    // Log error in background, don't block response
    queueMicrotask(() => {
      logInBackground({
        type: 'auth_exception',
        error: String(error)
      });
    });
    return errorRedirect(`${origin}/auth/auth-loading?error=${encodeURIComponent('Unknown error')}&description=${encodeURIComponent(String(error))}`);
  }
}