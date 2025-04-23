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

export const signinWithGoogle = async (
  userType?: 'tenant' | 'landlord'
) => {
  "use server";
  
  // Add specific logging for landlord flow
  if (userType === 'landlord') {
    console.log('[AUTH_ACTION] Starting landlord Google sign-in flow');
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

  // Update the query params to more explicitly handle landlord role
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
       
        ...(userType === 'landlord' ? { user_role: 'landlord' } : 
           userType === 'tenant' ? { user_role: 'tenant' } : {})
      },
      // Add user_role to the callback URL as well for redundancy
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/success${userType ? `&user_role=${userType}` : ''}`
    }
  });

  if (error) throw error;
  if (data && data.url) return redirect(data.url);
  throw new Error('No URL returned from OAuth response');
};

// Facebook signup is coming soon. The logic is temporarily disabled.
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
//       redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/success${userType ? `&user_role=${userType}` : ''}`
//     }
//   });
//   if (error) throw error;
//   if (data && data.url) return redirect(data.url);
//   throw new Error('No URL returned from OAuth response');
// };
