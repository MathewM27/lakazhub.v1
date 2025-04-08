export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimiter } from '@/utils/rate-limiter'

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

// Define allowed countries - add more country codes when expanding
// Currently restricted to Mauritius (MU) only
const ALLOWED_COUNTRIES = ['MU']; 

// For development testing
const DEV_MODE_BYPASS_GEO = process.env.NODE_ENV === 'development';

// Optimized redirect functions
const errorRedirect = (url: string) => NextResponse.redirect(url, { headers: ERROR_CACHE_HEADERS });
const successRedirect = (url: string) => NextResponse.redirect(url, { headers: SUCCESS_CACHE_HEADERS });

// Geolocation restriction response
const geoRestrictionResponse = (origin: string, country: string) => {
  return NextResponse.redirect(
    `${origin}/region-restricted?country=${encodeURIComponent(country || 'unknown')}`,
    { headers: ERROR_CACHE_HEADERS }
  );
};

export async function GET(request: Request) {
  // Parse URL only once
  const url = new URL(request.url);
  const { searchParams, origin } = url;
  
  // Get all parameters at once to minimize searchParams access
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const userRole = searchParams.get('user_role');
  const testCountry = searchParams.get('test_country'); // For development testing
  
  // Get client IP and country for geolocation check
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  'unknown';
  
  // Get country code - from Cloudflare or test parameter
  let countryCode = request.headers.get('cf-ipcountry') || null;
  
  // Allow testing in development mode
  if (DEV_MODE_BYPASS_GEO && testCountry) {
    countryCode = testCountry;
    logInBackground(`Testing with simulated country: ${countryCode}`);
  }
  
  // Check for rate limiting
  if (rateLimiter) {
    const { isLimited, resetTime } = rateLimiter.checkLimit(clientIp);
    if (isLimited) {
      logInBackground(`Rate limit exceeded for IP: ${clientIp}`);
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Please try again later',
          retryAfter: resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...ERROR_CACHE_HEADERS
          }
        }
      );
    }
  }

  // Check for geolocation restriction if country code is available
  if (countryCode && !DEV_MODE_BYPASS_GEO) {
    // If country is known and not in allowed list, redirect to region-restricted page
    if (!ALLOWED_COUNTRIES.includes(countryCode)) {
      logInBackground({
        type: 'geo_restricted',
        country: countryCode,
        ip: clientIp
      });
      return geoRestrictionResponse(origin, countryCode);
    }
  }

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
    logInBackground({
      type: 'auth_success',
      provider: 'google',
      country: countryCode,
      ip: clientIp // Store for security auditing
    });
    
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
              user_role: userRole === 'landlord' ? 'landlord' : 'tenant',
              country: countryCode, // Store user's country
              last_login_ip: clientIp // Store for security
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
    
    // If the auth was successful, reset any rate limits for this IP
    if (rateLimiter) {
      rateLimiter.resetLimit(clientIp);
    }
    
    // Return optimized redirect
    return successRedirect(`${baseUrl}${dashboardPath}?user_role=${userRole || 'tenant'}`);
    
  } catch (error) {
    // Log error in background, don't block response
    logInBackground({
      type: 'auth_exception',
      error: String(error),
      ip: clientIp
    });
    return errorRedirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('Unknown error')}&description=${encodeURIComponent(String(error))}`);
  }
}