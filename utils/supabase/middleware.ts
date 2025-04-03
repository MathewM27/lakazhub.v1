import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, skipSessionCheck = false) {
  console.log('[MIDDLEWARE_UTIL] updateSession called');
  console.log('[MIDDLEWARE_UTIL] Request path:', request.nextUrl.pathname);
  console.log('[MIDDLEWARE_UTIL] Skip session check:', skipSessionCheck);
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // If we're skipping session check (for auth callbacks), return early
  if (skipSessionCheck) {
    console.log('[MIDDLEWARE_UTIL] Skipping session check, returning early');
    return supabaseResponse
  }

  try {
    console.log('[MIDDLEWARE_UTIL] Checking for user session');
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    console.log('[MIDDLEWARE_UTIL] User exists:', !!user);
    if (user) {
      console.log('[MIDDLEWARE_UTIL] User ID:', user.id);
      console.log('[MIDDLEWARE_UTIL] User role:', user.user_metadata?.user_role);
    }

    if (
      !user &&
      !request.nextUrl.pathname.startsWith('/') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/success')
    ) {
      // no user, potentially respond by redirecting the user to the login page
      console.log('[MIDDLEWARE_UTIL] No user found and accessing protected route');
      console.log('[MIDDLEWARE_UTIL] Current path:', request.nextUrl.pathname);
      console.log('[MIDDLEWARE_UTIL] Redirecting to login page');
      
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    } else {
      console.log('[MIDDLEWARE_UTIL] User session valid or accessing public route');
    }
  } catch (error) {
    console.error('[MIDDLEWARE_UTIL] Error in middleware session check:', error)
  }

  return supabaseResponse
}