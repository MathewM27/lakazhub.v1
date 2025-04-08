export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// More efficient background logging
const logInBackground = (data: any) => {
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
  // Parse URL only once
  const url = new URL(request.url);
  const { searchParams, origin } = url;
  
  // Get all parameters at once to minimize searchParams access
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const userRole = searchParams.get('user_role');

  if (error) {
    const errorDescription = searchParams.get('error_description') || '';
    logInBackground(`Auth error: ${error}, Description: ${errorDescription}`);
    return errorRedirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription)}`);
  }

  if (!code) {
    return errorRedirect(`${origin}/auth/auth-code-error?error=no_code`);
  }
  
  // Initialize Supabase client once
  const supabase = await createClient();
  
  try {
    // Exchange code for session - critical path
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      logInBackground({
        type: 'session_error',
        error: sessionError.message,
        code: sessionError.status
      });
      return errorRedirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(sessionError.message)}`);
    }

    // Get session data - critical for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if we have a valid user session
    if (!session?.user) {
      return errorRedirect(`${origin}/auth/auth-code-error?error=no_session`);
    }
    
    // Log success in background (non-blocking)
    logInBackground({ type: 'auth_success', provider: 'google' });
    
    // Process Google user data if available
    // This is performance-optimized to avoid excessive string operations
    if (session.user.app_metadata?.provider === 'google') {
      const metadata = session.user.user_metadata || {};
      
      // Update user in background without blocking the redirect
      queueMicrotask(async () => {
        try {
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

    // Determine redirect using optimized path selection
    // Compute these values once to avoid redundant operations
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    
    // Use quick lookup rather than nested ternary
    const dashboardPath = 
      userRole === 'landlord' ? '/landlord-dashboard' :
      userRole === 'admin' ? '/admin-dashboard' : 
      '/tenant-dashboard';
    
    // Build redirect URL more efficiently
    const baseUrl = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin);
    
    // Return optimized redirect
    return successRedirect(`${baseUrl}${dashboardPath}?user_role=${userRole || 'tenant'}`);
    
  } catch (error) {
    // Log error in background, don't block response
    logInBackground({
      type: 'auth_exception',
      error: String(error)
    });
    return errorRedirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('Unknown error')}&description=${encodeURIComponent(String(error))}`);
  }
}