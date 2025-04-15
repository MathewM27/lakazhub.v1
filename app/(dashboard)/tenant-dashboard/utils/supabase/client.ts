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
export const supabase = isBrowser ? getSupabaseClient() : null as any;

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
// console.log('[SUPABASE_CLIENT] Initialized with URL:', supabaseUrl ? 'URL defined' : 'URL missing');
// console.log('[SUPABASE_CLIENT] Anon key available:', !!supabaseAnonKey);

// User-related functions
export async function getUserProfile(userId: string) {
  if (!supabase) {
    // console.error('[SUPABASE_CLIENT] Supabase client not initialized');
    return null;
  }
  
  try {
    // console.log('[SUPABASE_CLIENT] Fetching profile for user ID:', userId);
    
    // First check if the user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    // console.log('[SUPABASE_CLIENT] Current session exists:', !!sessionData.session);
    
    // Make the request with explicit headers
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no profile exists
    
    if (error) {
      // Check if this is a "no rows" error - this is actually expected for new users
      if (error.code === 'PGRST116') {
        // console.log('[SUPABASE_CLIENT] No profile found for user:', userId);
        return null; // Return null instead of throwing an error
      }
      
      // For other errors, log and throw
      // console.error('[SUPABASE_CLIENT] Error fetching user profile:', JSON.stringify(error));
      // console.error('[SUPABASE_CLIENT] Error code:', error.code);
      // console.error('[SUPABASE_CLIENT] Error details:', error.details);
      
      // If we got a 406 error, try a different approach
      if (error.code === '406') {
        // console.log('[SUPABASE_CLIENT] Received 406 error, trying alternative approach');
        
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
            // console.log('[SUPABASE_CLIENT] Alternative fetch succeeded:', profileData);
            return profileData[0] || null;
          } else {
            // console.error('[SUPABASE_CLIENT] Alternative fetch failed:', response.status, response.statusText);
          }
        } catch (altError) {
          // console.error('[SUPABASE_CLIENT] Alternative fetch error:', altError);
        }
      }
      
      // If we got here, both approaches failed
      return null;
    }
    
    // console.log('[SUPABASE_CLIENT] Profile fetched successfully:', data ? 'data exists' : 'data is null');
    return data;
  } catch (error) {
    // If we're offline, return null instead of continuously retrying
    if (error instanceof Error && 
        (error.message.includes('fetch failed') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('network'))) {
      // console.log('[SUPABASE_CLIENT] Network error when fetching profile - likely offline');
      return null;
    }
    // console.error('[SUPABASE_CLIENT] Unexpected error in getUserProfile:', error);
    return null; // Return null instead of throwing to prevent cascading errors
  }
}

export async function createUserProfile(profileData: any) {
  if (!supabase) {
    // console.error('[SUPABASE_CLIENT] Supabase client not initialized');
    return null;
  }
  
  try {
    // console.log('[SUPABASE_CLIENT] Creating user profile with data:', profileData);
    
    // Create a data object that matches your actual database schema
    const cleanedData = {
      id: profileData.id,
      full_name: profileData.full_name || 'User',
      email_address: profileData.email || '',
      // Use your enum value according to the check constraint
      user_role: profileData.user_role || 'tenant', // Use provided role or default to tenant
      phone_number: profileData.phone_number || null
    };
    
    // console.log('[SUPABASE_CLIENT] Cleaned profile data:', cleanedData);
    // console.log('[SUPABASE_CLIENT] User role being set:', cleanedData.user_role);
    
    // First check if profile already exists to avoid duplicate key errors
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileData.id)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      // console.error('[SUPABASE_CLIENT] Error checking existing profile:', JSON.stringify(checkError));
    }
      
    if (existingProfile) {
      // console.log('[SUPABASE_CLIENT] Profile already exists, updating instead of creating');
      const { data, error } = await supabase
        .from('profiles')
        .update(cleanedData)
        .eq('id', profileData.id)
        .select();
        
      if (error) {
        // console.error('[SUPABASE_CLIENT] Error updating user profile:', JSON.stringify(error));
        
        // Try alternative approach with raw fetch if we get a 406 error
        if (error.code === '406') {
          try {
            // console.log('[SUPABASE_CLIENT] Trying alternative update approach');
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
              // console.log('[SUPABASE_CLIENT] Alternative update succeeded:', updatedData);
              return updatedData[0] || null;
            }
          } catch (altError) {
            // console.error('[SUPABASE_CLIENT] Alternative update failed:', altError);
          }
        }
        
        return null;
      }
      
      // console.log('[SUPABASE_CLIENT] Profile updated successfully:', data?.[0]);
      return data?.[0] || null;
    }
    
    // Create new profile if it doesn't exist
    // console.log('[SUPABASE_CLIENT] Creating new profile');
    
    // First get the current session to ensure we're authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      // console.error('[SUPABASE_CLIENT] No active session when trying to create profile');
      return null;
    }
    
    // Add service_role key for admin access to bypass RLS
    const headers = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation'
    };
    
    // console.log('[SUPABASE_CLIENT] Using auth token for profile creation');
    
    try {
      // Try direct API approach first to bypass RLS issues
      const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers,
        body: JSON.stringify([cleanedData])
      });
      
      if (response.ok) {
        const insertedData = await response.json();
        // console.log('[SUPABASE_CLIENT] Profile created successfully via direct API:', insertedData);
        return insertedData[0] || null;
      }
      
      // console.log('[SUPABASE_CLIENT] Direct API approach failed, status:', response.status);
      // console.log('[SUPABASE_CLIENT] Response text:', await response.text());
    } catch (directApiError) {
      // console.error('[SUPABASE_CLIENT] Error with direct API approach:', directApiError);
    }
    
    // Fall back to the standard approach
    const { data, error } = await supabase
      .from('profiles')
      .insert([cleanedData])
      .select();
    
    if (error) {
      // console.error('[SUPABASE_CLIENT] Error creating user profile:', JSON.stringify(error));
      
      // Try alternative approach with raw fetch if we get a 406 error
      if (error.code === '406') {
        try {
          // console.log('[SUPABASE_CLIENT] Trying alternative insert approach');
          const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify([cleanedData])
          });
          
          if (response.ok) {
            const insertedData = await response.json();
            // console.log('[SUPABASE_CLIENT] Alternative insert succeeded:', insertedData);
            return insertedData[0] || null;
          }
        } catch (altError) {
          // console.error('[SUPABASE_CLIENT] Alternative insert failed:', altError);
        }
      }
      
      return null; // Return null instead of throwing to prevent infinite retries
    }
    
    // console.log('[SUPABASE_CLIENT] Profile created successfully:', data?.[0]);
    return data?.[0] || null;
  } catch (error) {
    // console.error('[SUPABASE_CLIENT] Unexpected error creating profile:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  if (!supabase) {
    // console.error('[SUPABASE_CLIENT] Supabase client not initialized');
    return null;
  }
  
  // console.log('[SUPABASE_CLIENT] Updating profile for user:', userId);
  // console.log('[SUPABASE_CLIENT] Update data:', updates);
  
  const { data, error } = await supabase
    .from('profiles') // Changed from user_profiles to profiles to match your schema
    .update(updates)
    .eq('id', userId) // Changed from user_id to id to match your schema
    .select()
    .single();
  
  if (error) {
    // console.error('[SUPABASE_CLIENT] Error updating user profile:', error);
    
    // Try alternative approach with raw fetch if we get a 406 error
    if (error.code === '406') {
      try {
        // console.log('[SUPABASE_CLIENT] Trying alternative update approach');
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updates)
        });
        
        if (response.ok) {
          const updatedData = await response.json();
          // console.log('[SUPABASE_CLIENT] Alternative update succeeded:', updatedData);
          return updatedData[0] as UserProfile;
        }
      } catch (altError) {
        // console.error('[SUPABASE_CLIENT] Alternative update failed:', altError);
      }
    }
    
    return null;
  }
  
  // console.log('[SUPABASE_CLIENT] Profile updated successfully:', data);
  return data as UserProfile;
}

// Add RLS testing function
export async function testRLSPolicies() {
  if (!supabase) {
    // console.error('[SUPABASE_CLIENT] Supabase client not initialized');
    return { success: false, error: 'Supabase client not initialized' };
  }
  
  try {
    // console.log('[SUPABASE_CLIENT] Testing RLS policies');
    
    // First check if the user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    // console.log('[SUPABASE_CLIENT] Session exists for RLS test:', !!sessionData.session);
    
    // Try to read from properties table anonymously
    const { data, error } = await supabase
      .from('properties')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      // console.error('[SUPABASE_CLIENT] RLS Test Failed:', error.message);
      
      // Check if this is an RLS error
      if (error.message.includes('permission denied') || error.message.includes('policy')) {
        /* console.error(
          '[SUPABASE_CLIENT] Row Level Security (RLS) is preventing access to properties table.\n' +
          'Please add this policy in your Supabase dashboard:\n\n' +
          'CREATE POLICY "Allow public to view all properties"\n' +
          'ON properties\n' +
          'FOR SELECT\n' +
          'USING (true);'
        ); */
        
        return {
          success: false, 
          isRLSIssue: true,
          error: error.message,
          solution: "Add a public SELECT policy for the properties table"
        };
      }
      
      return { success: false, error: error.message };
    }
    
    // console.log('[SUPABASE_CLIENT] RLS test successful');
    return { 
      success: true,
      count: data?.length || 0
    };
  } catch (err) {
    // console.error('[SUPABASE_CLIENT] Error testing RLS:', err);
    return { success: false, error: String(err) };
  }
}

// Add a function to check authentication status
export async function checkAuthStatus() {
  if (!supabase) {
    // console.error('[SUPABASE_CLIENT] Supabase client not initialized');
    return { authenticated: false, error: 'Supabase client not initialized' };
  }
  
  try {
    // console.log('[SUPABASE_CLIENT] Checking auth status');
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      // console.error('[SUPABASE_CLIENT] Error checking auth status:', error);
      return { authenticated: false, error: error.message };
    }
    
    const isAuthenticated = !!data.session;
    // console.log('[SUPABASE_CLIENT] User authenticated:', isAuthenticated);
    
    /* if (isAuthenticated && data.session?.user) {
      console.log('[SUPABASE_CLIENT] User ID:', data.session.user.id);
      console.log('[SUPABASE_CLIENT] User role:', data.session.user.user_metadata?.user_role);
    } */
    
    return { 
      authenticated: isAuthenticated,
      session: data.session,
      userId: data.session?.user?.id,
      userRole: data.session?.user?.user_metadata?.user_role
    };
  } catch (err) {
    // console.error('[SUPABASE_CLIENT] Unexpected error checking auth status:', err);
    return { authenticated: false, error: String(err) };
  }
}

// Expose functions to window for debugging
if (isBrowser) {
  (window as any).testRLSPolicies = testRLSPolicies;
  (window as any).checkAuthStatus = checkAuthStatus;
  (window as any).supabaseClient = supabase;
  /* console.log('[SUPABASE_CLIENT] Debug functions attached to window. Available functions:');
  console.log('[SUPABASE_CLIENT] - window.testRLSPolicies()');
  console.log('[SUPABASE_CLIENT] - window.checkAuthStatus()');
  console.log('[SUPABASE_CLIENT] - window.supabaseClient'); */
}