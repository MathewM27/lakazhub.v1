// This is a utility script to test authentication flow
import { supabase, getUserProfile, createUserProfile, checkAuthStatus, validateUserRole } from './supabase/client';

// Constants
const AUTH_ROLE = 'landlord';

/**
 * Test the landlord authentication flow and fix common issues
 * This is a comprehensive test that checks:
 * 1. Authentication status
 * 2. User metadata
 * 3. User profile
 * 4. Role validation
 * 5. Cache status
 */
export async function testLandlordAuth() {
  const results: Record<string, any> = {
    tests: [],
    fixes: [],
    cacheInfo: {}
  };
  
  try {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH_TEST] Starting landlord authentication test');
    }
    
    // Step 1: Check current auth status
    const authStatus = await checkAuthStatus();
    results.tests.push({
      name: 'Authentication Status',
      success: authStatus.authenticated,
      details: authStatus.authenticated ? 'User is authenticated' : 'User is not authenticated'
    });
    
    // If not authenticated, return early
    if (!authStatus.authenticated || !authStatus.user) {
      return {
        success: false,
        message: 'User not authenticated',
        user: null,
        profile: null,
        results
      };
    }
    
    // Step 2: Check user metadata
    const userRole = authStatus.user.user_metadata?.user_role;
    results.tests.push({
      name: 'User Metadata Role',
      success: userRole === AUTH_ROLE,
      details: userRole ? `Role: ${userRole}` : 'No role in metadata'
    });
    
    // Step 3: Check if profile exists
    const profile = await getUserProfile(authStatus.user.id);
    results.tests.push({
      name: 'User Profile',
      success: !!profile,
      details: profile ? `Profile exists with role: ${profile.user_role}` : 'No profile found'
    });
    
    // Step 4: Check role validation
    const hasCorrectRole = await validateUserRole(authStatus.user.id, AUTH_ROLE);
    results.tests.push({
      name: 'Role Validation',
      success: hasCorrectRole,
      details: hasCorrectRole ? 'User has correct role' : 'User does not have correct role'
    });
    
    // Step 5: Check cache status
    if (typeof window !== 'undefined') {
      // Check auth cache
      const authCache = sessionStorage.getItem('auth_status');
      const authCacheTime = sessionStorage.getItem('auth_status_time');
      
      results.cacheInfo.auth = {
        exists: !!authCache,
        age: authCacheTime ? `${Math.round((Date.now() - parseInt(authCacheTime)) / 1000)}s ago` : 'N/A'
      };
      
      // Check profile cache
      const profileCache = localStorage.getItem(`profile_${authStatus.user.id}`);
      const profileCacheTime = localStorage.getItem(`profile_time_${authStatus.user.id}`);
      
      results.cacheInfo.profile = {
        exists: !!profileCache,
        age: profileCacheTime ? `${Math.round((Date.now() - parseInt(profileCacheTime)) / 1000)}s ago` : 'N/A'
      };
    }
    
    // Fix issues if needed
    if (!profile) {
      // Create profile if it doesn't exist
      try {
        const newProfile = await createUserProfile({
          id: authStatus.user.id,
          email: authStatus.user.email,
          full_name: authStatus.user.user_metadata?.full_name || 'User',
          user_role: AUTH_ROLE,
          phone_number: authStatus.user.user_metadata?.phone_number
        });
        
        results.fixes.push({
          name: 'Create Profile',
          success: !!newProfile,
          details: newProfile ? 'Profile created successfully' : 'Failed to create profile'
        });
      } catch (error) {
        results.fixes.push({
          name: 'Create Profile',
          success: false,
          details: `Error: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    
    // Update user metadata if role is incorrect
    if (userRole !== AUTH_ROLE) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          data: { user_role: AUTH_ROLE }
        });
        
        results.fixes.push({
          name: 'Update User Metadata',
          success: !error,
          details: error ? `Error: ${error.message}` : 'User metadata updated successfully'
        });
      } catch (error) {
        results.fixes.push({
          name: 'Update User Metadata',
          success: false,
          details: `Error: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    
    // Determine overall success
    const allTestsPassed = results.tests.every((test: any) => test.success);
    const allFixesSucceeded = results.fixes.length === 0 || results.fixes.every((fix: any) => fix.success);
    const overallSuccess = allTestsPassed || allFixesSucceeded;
    
    return {
      success: overallSuccess,
      message: overallSuccess 
        ? 'Authentication test completed successfully' 
        : 'Authentication issues detected',
      user: authStatus.user,
      profile: profile || null,
      results
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[AUTH_TEST] Error in authentication test:', error);
    }
    
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      user: null,
      profile: null,
      results
    };
  }
}

// Expose to window for debugging only in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testLandlordAuth = testLandlordAuth;
}
