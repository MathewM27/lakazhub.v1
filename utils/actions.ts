'use server'

import { createServerClient } from "@supabase/ssr"
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from "./supabase/client"

interface SignInWithOAuthResponse {
  data: { url: string | null }
  error: any
}

interface SigninWithMagicLinkResponse {
  success: string | null
  error: string | null
}

type Provider = 'google' | 'apple' | 'facebook';

// Remove Magic Link sign-up logic and export

// Update to always use production URL
function getServerSideAppUrl(path: string = '') {
  // Always use production URL in production mode
  const baseUrl = 'https://lakazhub.com';
  return `${baseUrl}${path ? (path.startsWith('/') ? path : `/${path}`) : ''}`;
}

export const signinWithGoogle = async (
  userType?: 'tenant' | 'landlord'
) => {
  "use server";
  
  // Add specific logging for landlord flow
  if (userType === 'landlord') {
    // console.log('[AUTH_ACTION] Starting landlord Google sign-in flow');
  }
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Use the server-side function to get the redirect URL
  const redirectUrl = getServerSideAppUrl(`auth/callback?next=/success${userType ? `&user_role=${userType}` : ''}`);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        ...(userType ? { user_role: userType } : {})
      },
      redirectTo: redirectUrl
    }
  });

  if (error) throw error;
  if (data && data.url) return redirect(data.url);
  throw new Error('No URL returned from OAuth response');
};

// Commented out Facebook auth contains localhost:3000 as well
// export const signinWithFacebook = async (
//   userType?: 'tenant' | 'landlord'
// ) => {
//   "use server";
//   const cookieStore = await cookies();
//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return cookieStore.getAll();
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             cookieStore.set(name, value, options)
//           );
//         },
//       },
//     }
//   );
//   const { data, error } = await supabase.auth.signInWithOAuth({
//     provider: 'facebook',
//     options: {
//       queryParams: {
//         ...(userType === 'landlord' ? { user_role: 'landlord' } : 
//            userType === 'tenant' ? { user_role: 'tenant' } : {})
//       },
//       redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lakazhub.com'}/auth/callback?next=/success${userType ? `&user_role=${userType}` : ''}`
//     }
//   });
//   if (error) throw error;
//   if (data && data.url) return redirect(data.url);
//   throw new Error('No URL returned from OAuth response');
// };
