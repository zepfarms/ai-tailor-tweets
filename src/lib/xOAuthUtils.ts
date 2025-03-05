
// Utilities for X (Twitter) OAuth 2.0 process
import { supabase } from "@/integrations/supabase/client";

// Store OAuth state and code verifier in sessionStorage
export const storeOAuthParams = (state: string, codeVerifier: string) => {
  try {
    sessionStorage.setItem('x_oauth_state', state);
    sessionStorage.setItem('x_oauth_code_verifier', codeVerifier);
    console.log('Stored OAuth parameters in sessionStorage');
  } catch (error) {
    console.error('Error storing OAuth parameters:', error);
    throw new Error('Failed to store OAuth parameters');
  }
};

// Get stored OAuth parameters
export const getStoredOAuthParams = () => {
  try {
    const state = sessionStorage.getItem('x_oauth_state');
    const codeVerifier = sessionStorage.getItem('x_oauth_code_verifier');
    console.log('Retrieved OAuth parameters from sessionStorage');
    return { state, codeVerifier };
  } catch (error) {
    console.error('Error retrieving OAuth parameters:', error);
    return { state: null, codeVerifier: null };
  }
};

// Clear OAuth parameters
export const clearOAuthParams = () => {
  try {
    sessionStorage.removeItem('x_oauth_state');
    sessionStorage.removeItem('x_oauth_code_verifier');
    sessionStorage.removeItem('x_auth_redirect');
    console.log('Cleared OAuth parameters from sessionStorage');
  } catch (error) {
    console.error('Error clearing OAuth parameters:', error);
  }
};

// Store current page for redirect
export const storeCurrentPage = () => {
  const currentPath = window.location.pathname;
  if (currentPath !== '/x-callback') {
    sessionStorage.setItem('x_auth_redirect', currentPath);
    console.log('Stored current page for redirect:', currentPath);
  }
};

// Get stored redirect page
export const getStoredRedirectPage = (): string => {
  const redirect = sessionStorage.getItem('x_auth_redirect') || '/dashboard';
  return redirect;
};

// Start X OAuth flow
export const startXOAuthFlow = async (): Promise<void> => {
  try {
    console.log('Starting X OAuth flow');
    
    // Store current page for redirect after auth
    storeCurrentPage();
    
    // Clear any existing OAuth parameters
    clearOAuthParams();
    
    // Call Edge Function to get authorization URL
    const { data, error } = await supabase.functions.invoke('twitter-request-token', {
      method: 'POST'
    });
    
    if (error) {
      console.error('Error calling twitter-request-token function:', error);
      throw new Error('Failed to start X authorization');
    }
    
    if (!data || !data.authorizeUrl || !data.state || !data.codeVerifier) {
      console.error('Invalid response from twitter-request-token function:', data);
      throw new Error('Invalid response from server');
    }
    
    // Store OAuth parameters
    storeOAuthParams(data.state, data.codeVerifier);
    
    // Redirect to Twitter authorization page
    window.location.href = data.authorizeUrl;
  } catch (error) {
    console.error('Error starting X OAuth flow:', error);
    throw error;
  }
};

// Complete X OAuth flow
export const completeXOAuthFlow = async (code: string): Promise<{
  success: boolean;
  username: string;
  profileImageUrl?: string;
}> => {
  try {
    console.log('Completing X OAuth flow with code:', code.substring(0, 10) + '...');
    
    // Get stored OAuth parameters
    const { codeVerifier } = getStoredOAuthParams();
    
    if (!codeVerifier) {
      console.error('No code verifier found in session storage');
      throw new Error('Authorization session expired or invalid');
    }
    
    // Get user ID if available
    let userId = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userId = session.user.id;
        console.log('User ID for account linking:', userId);
      }
    } catch (authError) {
      console.error('Error getting user session:', authError);
    }
    
    // Call Edge Function to get access token
    const { data, error } = await supabase.functions.invoke('twitter-access-token', {
      method: 'POST',
      body: {
        code,
        codeVerifier,
        userId
      }
    });
    
    if (error) {
      console.error('Error calling twitter-access-token function:', error);
      throw new Error('Failed to complete X authorization');
    }
    
    if (!data || !data.success) {
      console.error('Invalid response from twitter-access-token function:', data);
      throw new Error(data?.error || 'Failed to complete X authorization');
    }
    
    // Clear OAuth parameters
    clearOAuthParams();
    
    console.log('X account successfully linked:', data.username);
    
    return {
      success: true,
      username: data.username,
      profileImageUrl: data.profileImageUrl
    };
  } catch (error) {
    console.error('Error completing X OAuth flow:', error);
    clearOAuthParams();
    throw error;
  }
};
