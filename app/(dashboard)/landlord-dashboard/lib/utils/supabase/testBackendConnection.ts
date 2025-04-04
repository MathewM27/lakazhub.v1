// utils/supabase/testBackendConnection.ts
import { supabase } from './client';

// Ensure API_URL is properly formatted with http://localhost
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = rawApiUrl.startsWith('http') 
  ? rawApiUrl 
  : `http://localhost:${rawApiUrl}`;

/**
 * Tests the connection to the backend with authentication
 * @returns Object with success status and message
 */
export async function testBackendConnection() {
  try {
    console.log(`Attempting to connect to backend API at: ${API_URL}`);
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return {
        success: false,
        message: `Auth session error: ${sessionError.message}`
      };
    }

    if (!session) {
      console.log('No active session found');
      return {
        success: false,
        message: 'Not authenticated. Please log in first.'
      };
    }

    console.log('Authentication session found, attempting API request');
    
    // Make an authenticated request to the backend
    try {
      const response = await fetch(`${API_URL}/api/test/auth-test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Could not parse error response' }));
        throw new Error(errorData.message || `Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: `Connection successful! Authenticated as ${data.user?.email || 'user'}`,
        user: data.user
      };
      
    } catch (fetchError) {
      if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
        console.error('Connection refused - Is your backend server running at', API_URL, '?');
        return {
          success: false,
          message: `Could not connect to backend server at ${API_URL}. Is the server running?`,
          details: 'Connection refused'
        };
      }
      throw fetchError;
    }

  } catch (error: unknown) {
    console.error('Backend connection test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to connect to backend',
      details: error instanceof Error ? error.stack : undefined
    };
  }
}