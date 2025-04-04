// This is a utility script to test authentication flow
import { supabase, getUserProfile, createUserProfile, checkAuthStatus } from './supabase/client';

export async function testLandlordAuth() {
  try {
    console.log('[AUTH_TEST] Starting landlord authentication test');
    
    // Check current auth status
    const authStatus = await checkAuthStatus();
    console.log('[AUTH_TEST] Auth status:', authStatus);
    
    if (authStatus.authenticated && authStatus.user) {
      // Check if user has landlord role in metadata
      const userRole = authStatus.user.user_metadata?.user_role;
      console.log('[AUTH_TEST] User role from metadata:', userRole);
      
      // Check if profile exists
      const profile = await getUserProfile(authStatus.user.id);
      console.log('[AUTH_TEST] User profile:', profile);
      
      // If profile doesn't exist, create one
      if (!profile) {
        console.log('[AUTH_TEST] Creating profile for user');
        const newProfile = await createUserProfile({
          id: authStatus.user.id,
          email: authStatus.user.email,
          full_name: authStatus.user.user_metadata?.full_name || 'User',
          user_role: 'landlord',
          phone_number: authStatus.user.user_metadata?.phone_number
        });
        console.log('[AUTH_TEST] New profile created:', newProfile);
      }
      
      // If user doesn't have landlord role in metadata, update it
      if (userRole !== 'landlord') {
        console.log('[AUTH_TEST] Updating user metadata with landlord role');
        const { data, error } = await supabase.auth.updateUser({
          data: { user_role: 'landlord' }
        });
        
        if (error) {
          console.error('[AUTH_TEST] Error updating user metadata:', error);
        } else {
          console.log('[AUTH_TEST] User metadata updated successfully');
        }
      }
      
      return {
        success: true,
        message: 'Authentication test completed successfully',
        user: authStatus.user,
        profile: profile || null
      };
    } else {
      console.log('[AUTH_TEST] User not authenticated');
      return {
        success: false,
        message: 'User not authenticated',
        user: null,
        profile: null
      };
    }
  } catch (error) {
    console.error('[AUTH_TEST] Error in authentication test:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      user: null,
      profile: null
    };
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).testLandlordAuth = testLandlordAuth;
}
