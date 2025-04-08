import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define public paths once to avoid recomputation
const PUBLIC_PATHS = [
  '/',
  '/auth',
  '/success',
  // Add any other public paths
];

// Optimize path checking with simple function
const isPublicPath = (pathname: string) => {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
};

export async function updateSession(request: NextRequest, skipSessionCheck = false) {
  // Quick path for auth endpoints - no need for full middleware processing
  if (skipSessionCheck || request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value); 
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // If public path, allow access without checking user
  if (isPublicPath(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  try {
    // Check session
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect if no user and attempting to access protected route
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error('Middleware session error:', error);
    // Continue on error to avoid blocking
  }

  return supabaseResponse;
}