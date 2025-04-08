import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

// Fix the type to properly handle the cookies() return type
let cachedCookieStore: ReadonlyRequestCookies | null = null;

export async function createClient() {
  // Ensure we're dealing with the resolved cookie store object
  if (!cachedCookieStore) {
    // Since cookies() appears to be returning a Promise in your environment
    cachedCookieStore = await cookies();
  }

  // Now use the properly typed cookie store
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cachedCookieStore!.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cachedCookieStore!.set(name, value, options)
            );
          } catch {
            // Ignore cookie setting errors in Server Components
            // This is handled by middleware
          }
        },
      },
      // Auth options for performance
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
      }
    }
  );
}