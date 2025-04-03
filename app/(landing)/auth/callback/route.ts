import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  console.log('[AUTH_CALLBACK] Auth callback route triggered');
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'
  
  console.log('[AUTH_CALLBACK] Request URL:', request.url);
  console.log('[AUTH_CALLBACK] Auth code exists:', !!code);
  console.log('[AUTH_CALLBACK] Next path:', next);

  // Check if there's user_role in URL params (passed from signInWithOAuth)
  const userRole = searchParams.get('user_role')
  console.log('[AUTH_CALLBACK] User role from params:', userRole);

  if (error) {
    console.error(`[AUTH_CALLBACK] Auth error: ${error}, Description: ${errorDescription}`)
    console.log('[AUTH_CALLBACK] Redirecting to error page');
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`)
  }

  if (code) {
    console.log('[AUTH_CALLBACK] Processing auth code');
    const supabase = await createClient()
    try {
      // Exchange code for session
      console.log('[AUTH_CALLBACK] Exchanging code for session');
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('[AUTH_CALLBACK] Session exchange error:', {
          error: sessionError.message,
          code: sessionError.status,
          timestamp: new Date().toISOString()
        })
        console.log('[AUTH_CALLBACK] Redirecting to error page due to session exchange error');
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(sessionError.message)}`)
      }
      
      console.log('[AUTH_CALLBACK] Successfully exchanged code for session');

      // Log successful authentication
      console.log('[AUTH_CALLBACK] Authentication successful', {
        provider: 'google',
        timestamp: new Date().toISOString()
      })

      // Get the user session
      console.log('[AUTH_CALLBACK] Getting user session');
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[AUTH_CALLBACK] Session exists:', !!session);
      console.log('[AUTH_CALLBACK] User ID:', session?.user?.id);
      
      // For Google OAuth users, process their profile data
      if (session && session.user && session.user.app_metadata?.provider === 'google') {
        console.log('[AUTH_CALLBACK] Processing Google OAuth user');
        console.log('[AUTH_CALLBACK] User metadata:', JSON.stringify(session.user.user_metadata));
        
        // Extract names from Google OAuth response
        const firstName = session.user.user_metadata?.given_name || 
                          session.user.user_metadata?.full_name?.split(' ')[0] || 
                          'Unknown'
        const lastName = session.user.user_metadata?.family_name || 
                         session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                         'User'
        const fullName = `${firstName} ${lastName}`
        
        console.log('[AUTH_CALLBACK] Extracted user info:', { firstName, lastName, fullName });
        
        // Set user_role from URL parameters (passed during initial OAuth request)
        // This is critical for your database trigger
        console.log('[AUTH_CALLBACK] Updating user with role:', userRole || 'tenant');
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            phone_number: '', // Required by your SQL trigger
            user_role: userRole || 'tenant' // Default to tenant if not specified
          }
        })
        
        if (updateError) {
          console.error('[AUTH_CALLBACK] Error updating user:', updateError);
        } else {
          console.log('[AUTH_CALLBACK] User updated successfully');
          console.log('[AUTH_CALLBACK] Updated metadata:', JSON.stringify(updateData.user.user_metadata));
        }
      } else {
        console.log('[AUTH_CALLBACK] Not a Google OAuth user or session missing');
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      console.log('[AUTH_CALLBACK] Environment:', isLocalEnv ? 'development' : 'production');
      console.log('[AUTH_CALLBACK] Forwarded host:', forwardedHost);
      
      let redirectUrl = '';
      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`;
      } else {
        redirectUrl = `${origin}${next}`;
      }
      
      console.log('[AUTH_CALLBACK] Redirecting to:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      // More detailed error logging...
      console.error('[AUTH_CALLBACK] Authentication exception:', {
        error: String(error),
        timestamp: new Date().toISOString(),
        url: request.url
      })
      console.log('[AUTH_CALLBACK] Redirecting to error page due to exception');
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('Unknown error')}&description=${encodeURIComponent(String(error))}`)
    }
  }

  console.log('[AUTH_CALLBACK] No code provided, redirecting to error page');
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
}