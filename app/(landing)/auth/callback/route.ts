import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Check if there's user_role in URL params (passed from signInWithOAuth)
  const userRole = searchParams.get('user_role')

  if (error) {
    console.error(`Auth error: ${error}, Description: ${errorDescription}`)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`)
  }

  if (code) {
    const supabase = await createClient()
    try {
      // Exchange code for session
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Session exchange error:', {
          error: sessionError.message,
          code: sessionError.status,
          timestamp: new Date().toISOString()
        })
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(sessionError.message)}`)
      }

      // Log successful authentication
      console.log('Authentication successful', {
        provider: 'google',
        timestamp: new Date().toISOString()
      })

      // Get the user session
      const { data: { session } } = await supabase.auth.getSession()
      
      // For Google OAuth users, process their profile data
      if (session && session.user && session.user.app_metadata?.provider === 'google') {
        // Extract names from Google OAuth response
        const firstName = session.user.user_metadata?.given_name || 
                          session.user.user_metadata?.full_name?.split(' ')[0] || 
                          'Unknown'
        const lastName = session.user.user_metadata?.family_name || 
                         session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                         'User'
        const fullName = `${firstName} ${lastName}`
        
        // Set user_role from URL parameters (passed during initial OAuth request)
        // This is critical for your database trigger
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            phone_number: '', // Required by your SQL trigger
            user_role: userRole || 'tenant' // Default to tenant if not specified
          }
        })
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      // More detailed error logging...
      console.error('Authentication exception:', {
        error: String(error),
        timestamp: new Date().toISOString(),
        url: request.url
      })
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('Unknown error')}&description=${encodeURIComponent(String(error))}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
}