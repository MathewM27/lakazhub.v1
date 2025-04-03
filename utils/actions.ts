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

// Magic Link sign-up that passes additional metadata
const signinWithMagicLink = async (
  _prev: any,
  email: string,
  fullName: string,
  phoneNumber: string,
  userType: 'tenant' | 'landlord'
): Promise<SigninWithMagicLinkResponse> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  });

  // Pass metadata keys that match the SQL trigger function
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.SITE_URL || window.location.origin}/auth/callback?next=/success`,
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
        user_role: userType
      },
    },
  });

  if (error) {
    console.error('Magic link sign-in error:', error);
    return {
      success: null,
      error: error.message,
    };
  }

  return {
    success: 'Please check your email for the magic link.',
    error: null,
  };
};

export const signinWithGoogle = async (
  userType?: 'tenant' | 'landlord'
) => {
  "use server";
  
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

  // Try once without retrying - most errors are auth-related, not connectivity
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        ...(userType && { user_role: userType })
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/success`
    }
  });

  if (error) throw error;
  if (data && data.url) return redirect(data.url);
  throw new Error('No URL returned from OAuth response');
};

export {
  signinWithMagicLink,
};
