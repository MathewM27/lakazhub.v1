import { createBrowserClient } from '@supabase/ssr';
import { UserProfile } from '@/utils/types/user';
import { SupabaseClient } from '@supabase/supabase-js';

// Check if we're in a browser environment to avoid server-side errors
const isBrowser = typeof window !== 'undefined';

// Initialize with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string; 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Use a singleton pattern to ensure we only have one client instance
let supabaseInstance: SupabaseClient | null = null;

// Create the Supabase client
export const supabase = isBrowser ? getSupabaseClient() : null as unknown as SupabaseClient;

// Function to get or create the Supabase client
function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;
  
  // Create a new client if one doesn't exist
  supabaseInstance = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      },
    }
  );
  
  return supabaseInstance;
}

// Log Supabase configuration for debugging
console.log('[SUPABASE_CLIENT] Initialized with URL:', supabaseUrl ? 'URL defined' : 'URL missing');
console.log('[SUPABASE_CLIENT] Anon key available:', !!supabaseAnonKey);

// User-related functions
export async function getUserProfile(userId: string) {
  if (!supabase) {
    console.error('[SUPABASE_CLIENT] Supabase client not initialized');
    return null;
  }
  
  try {
    console.log('[SUPABASE_CLIENT] Fetching profile for user ID:', userId);
    
    // First check if the user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('[SUPABASE_CLIENT] Current session exists:', !!sessionData.session);
    
    // Make the request with explicit headers
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no profile exists
    
    if (error) {
      // Check if this is a "no rows" error - this is actually expected for new users
      if (error.code === 'PGRST116') {
        console.log('[SUPABASE_CLIENT] No profile found for user:', userId);
        return null; // Return null instead of throwing an error
      }
      
      // For other errors, log and throw
      console.error('[SUPABASE_CLIENT] Error fetching user profile:', JSON.stringify(error));
      console.error('[SUPABASE_CLIENT] Error code:', error.code);
      console.error('[SUPABASE_CLIENT] Error details:', error.details);
      
      // If we got a 406 error, try a different approach
      if (error.code === '406') {
        console.log('[SUPABASE_CLIENT] Received 406 error, trying alternative approach');
        
        // Try a raw fetch with explicit headers as a fallback
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
            method: 'GET',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          
          if (response.ok) {
            const profileData = await response.json();
            console.log('[SUPABASE_CLIENT] Alternative fetch succeeded:', profileData);
            return profileData[0] || null;
          } else {
            console.error('[SUPABASE_CLIENT] Alternative fetch failed:', response.status, response.statusText);
          }
        } catch (altError) {
          console.error('[SUPABASE_CLIENT] Alternative fetch error:', altError);
        }
      }
      
      // If we got here, both approaches failed
      return null;
    }
    
    console.log('[SUPABASE_CLIENT] Profile fetched successfully:', data ? 'data exists' : 'data is null');
    return data;
  } catch (error) {
    // If we're offline, return null instead of continuously retrying
    if (error instanceof Error && 
        (error.message.includes('fetch failed') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('network'))) {
      console.log('[SUPABASE_CLIENT] Network error when fetching profile - likely offline');
      return null;
    }
    console.error('[SUPABASE_CLIENT] Unexpected error in getUserProfile:', error);
    return null; // Return null instead of throwing to prevent cascading errors
  }
}

export async function createUserProfile(profileData: Partial<UserProfile> & { email?: string }) {
  if (!supabase) {
    console.error('[SUPABASE_CLIENT] Supabase client not initialized');
    return null;
  }
  
  try {
    console.log('[SUPABASE_CLIENT] Creating user profile with data:', profileData);
    
    // Create a data object that matches your actual database schema
    const cleanedData = {
      id: profileData.id,
      full_name: profileData.full_name || 'User',
      email_address: profileData.email || '',
      // Use your enum value according to the check constraint
      user_role: profileData.user_role || 'landlord', // Default to landlord for this dashboard
      phone_number: profileData.phone_number || null
    };
    
    console.log('[SUPABASE_CLIENT] Cleaned profile data:', cleanedData);
    console.log('[SUPABASE_CLIENT] User role being set:', cleanedData.user_role);
    
    // First check if profile already exists to avoid duplicate key errors
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileData.id)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[SUPABASE_CLIENT] Error checking existing profile:', JSON.stringify(checkError));
    }
      
    if (existingProfile) {
      console.log('[SUPABASE_CLIENT] Profile already exists, updating instead of creating');
      const { data, error } = await supabase
        .from('profiles')
        .update(cleanedData)
        .eq('id', profileData.id)
        .select();
        
      if (error) {
        console.error('[SUPABASE_CLIENT] Error updating user profile:', JSON.stringify(error));
        
        // Try alternative approach with raw fetch if we get a 406 error
        if (error.code === '406') {
          try {
            console.log('[SUPABASE_CLIENT] Trying alternative update approach');
            const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${profileData.id}`, {
              method: 'PATCH',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(cleanedData)
            });
            
            if (response.ok) {
              const updatedData = await response.json();
              console.log('[SUPABASE_CLIENT] Alternative update succeeded:', updatedData);
              return updatedData[0] || null;
            }
          } catch (altError) {
            console.error('[SUPABASE_CLIENT] Alternative update failed:', altError);
          }
        }
        
        return null;
      }
      
      console.log('[SUPABASE_CLIENT] Profile updated successfully:', data ? 'data exists' : 'data is null');
      return data?.[0] || null;
    } else {
      // Create a new profile
      console.log('[SUPABASE_CLIENT] Creating new profile');
      const { data, error } = await supabase
        .from('profiles')
        .insert(cleanedData)
        .select();
        
      if (error) {
        console.error('[SUPABASE_CLIENT] Error creating user profile:', JSON.stringify(error));
        
        // Try alternative approach with raw fetch if we get a 406 error
        if (error.code === '406') {
          try {
            console.log('[SUPABASE_CLIENT] Trying alternative insert approach');
            const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
              method: 'POST',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(cleanedData)
            });
            
            if (response.ok) {
              const insertedData = await response.json();
              console.log('[SUPABASE_CLIENT] Alternative insert succeeded:', insertedData);
              return insertedData[0] || null;
            }
          } catch (altError) {
            console.error('[SUPABASE_CLIENT] Alternative insert failed:', altError);
          }
        }
        
        return null;
      }
      
      console.log('[SUPABASE_CLIENT] Profile created successfully:', data ? 'data exists' : 'data is null');
      return data?.[0] || null;
    }
  } catch (error) {
    console.error('[SUPABASE_CLIENT] Unexpected error in createUserProfile:', error);
    return null; // Return null instead of throwing to prevent cascading errors
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  if (!supabase) {
    console.error('[SUPABASE_CLIENT] Supabase client not initialized');
    return null;
  }
  
  try {
    console.log('[SUPABASE_CLIENT] Updating profile for user ID:', userId);
    console.log('[SUPABASE_CLIENT] Update data:', updates);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();
      
    if (error) {
      console.error('[SUPABASE_CLIENT] Error updating user profile:', JSON.stringify(error));
      return null;
    }
    
    console.log('[SUPABASE_CLIENT] Profile updated successfully:', data ? 'data exists' : 'data is null');
    return data?.[0] || null;
  } catch (error) {
    console.error('[SUPABASE_CLIENT] Unexpected error in updateUserProfile:', error);
    return null; // Return null instead of throwing to prevent cascading errors
  }
}

// Add a function to check authentication status
export async function checkAuthStatus() {
  if (!supabase) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SUPABASE_CLIENT] Supabase client not initialized');
    }
    return { authenticated: false, user: null, error: 'Client not initialized' };
  }
  
  try {
    // Check if we have a cached auth status to reduce API calls
    if (isBrowser) {
      const cachedAuthStatus = sessionStorage.getItem('auth_status');
      const cacheTime = sessionStorage.getItem('auth_status_time');
      
      if (cachedAuthStatus && cacheTime) {
        try {
          const authStatus = JSON.parse(cachedAuthStatus);
          // Use cache if it's less than 1 minute old
          if ((Date.now() - parseInt(cacheTime)) < 60 * 1000) {
            return authStatus;
          }
        } catch (_) {
          // Invalid cache, continue with API call
        }
      }
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SUPABASE_CLIENT] Error checking auth status:', error);
      }
      return { authenticated: false, user: null, error: error.message };
    }
    
    const result = data.session 
      ? { authenticated: true, user: data.session.user, error: null }
      : { authenticated: false, user: null, error: null };
    
    // Cache the auth status
    if (isBrowser) {
      sessionStorage.setItem('auth_status', JSON.stringify(result));
      sessionStorage.setItem('auth_status_time', Date.now().toString());
    }
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SUPABASE_CLIENT] Unexpected error in checkAuthStatus:', error);
    }
    return { authenticated: false, user: null, error: String(error) };
  }
}

// Function to validate user role server-side
export async function validateUserRole(userId: string, requiredRole: string) {
  if (!supabase) return false;
  
  try {
    // Get user profile from database
    const profile = await getUserProfile(userId);
    
    // Check if profile exists and has the required role
    return !!profile && profile.user_role === requiredRole;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SUPABASE_CLIENT] Error validating user role:', error);
    }
    return false;
  }
}

// Define types for window extensions
interface WindowWithDebugFunctions extends Window {
  checkAuthStatus: typeof checkAuthStatus;
  getUserProfile: typeof getUserProfile;
  createUserProfile: typeof createUserProfile;
  updateUserProfile: typeof updateUserProfile;
  validateUserRole: typeof validateUserRole;
}

// Expose functions to window for debugging only in development
if (isBrowser && process.env.NODE_ENV === 'development') {
  const windowObj = window as unknown as WindowWithDebugFunctions;
  windowObj.checkAuthStatus = checkAuthStatus;
  windowObj.getUserProfile = getUserProfile;
  windowObj.createUserProfile = createUserProfile;
  windowObj.updateUserProfile = updateUserProfile;
  windowObj.validateUserRole = validateUserRole;
}