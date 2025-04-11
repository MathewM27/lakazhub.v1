import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define public paths once to avoid recomputation
const PUBLIC_PATHS = [
  '/',
  '/auth',
  '/success',
  '/about',
  '/contact',
  '/help',
  // Add any other public paths
];

// Role-based path patterns
const TENANT_PATH_PATTERN = /^\/tenant-dashboard/;
const LANDLORD_PATH_PATTERN = /^\/landlord-dashboard/;

// Optimize path checking with simple function
const isPublicPath = (pathname: string) => {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
};

// Check if path requires a specific role
const getRequiredRole = (pathname: string): string | null => {
  if (TENANT_PATH_PATTERN.test(pathname)) return 'tenant';
  if (LANDLORD_PATH_PATTERN.test(pathname)) return 'landlord';
  return null;
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
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    
    // If no session/user, redirect to login
    if (!session || !user) {
      console.log(`Middleware: No authenticated user detected, redirecting from ${request.nextUrl.pathname}`);
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Check if the path requires a specific role
    const requiredRole = getRequiredRole(request.nextUrl.pathname);
    
    if (requiredRole) {
      let userRole: string | null = null;
      
      // First check user metadata for role (fastest)
      if (user.user_metadata?.user_role) {
        userRole = user.user_metadata.user_role;
      } else {
        // If not in metadata, check database profile (source of truth)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single();
          
        userRole = profileData?.user_role || null;
      }
      
      // If user doesn't have the required role, redirect to appropriate dashboard or home
      if (!userRole || userRole !== requiredRole) {
        console.log(`Middleware: User has role ${userRole}, but ${requiredRole} is required`);
        
        if (userRole === 'tenant' && requiredRole === 'landlord') {
          return NextResponse.redirect(new URL('/tenant-dashboard', request.url));
        } else if (userRole === 'landlord' && requiredRole === 'tenant') {
          return NextResponse.redirect(new URL('/landlord-dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }

  } catch (error) {
    console.error('Middleware session error:', error);
    // Continue on error to avoid blocking but log to Sentry
    // You would add Sentry.captureException(error) here if needed
  }

  return supabaseResponse;
}