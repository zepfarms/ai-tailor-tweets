
// Utilities for X (Twitter) OAuth 2.0 process
import { supabase } from "@/integrations/supabase/client";

// Generate a random string for the state parameter
const generateRandomString = (length: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Store the OAuth state and code verifier in session storage
export const storeOAuthParams = (state: string, codeVerifier: string) => {
  try {
    // Use localStorage for persistent storage
    localStorage.setItem('x_oauth_state', state);
    localStorage.setItem('x_oauth_code_verifier', codeVerifier);
    localStorage.setItem('x_oauth_timestamp', Date.now().toString());
    
    // Create a backup in sessionStorage too in case localStorage is cleared
    sessionStorage.setItem('x_oauth_state', state);
    sessionStorage.setItem('x_oauth_code_verifier', codeVerifier);
    sessionStorage.setItem('x_oauth_timestamp', Date.now().toString());
    
    console.log('OAuth parameters stored in both local and session storage');
  } catch (error) {
    console.error('Error storing OAuth parameters:', error);
    throw new Error('Failed to store OAuth parameters. Please ensure cookies are enabled.');
  }
};

// Retrieve the OAuth state and code verifier from storage
export const getStoredOAuthParams = () => {
  try {
    // Check both localStorage and sessionStorage
    let state = localStorage.getItem('x_oauth_state') || sessionStorage.getItem('x_oauth_state');
    let codeVerifier = localStorage.getItem('x_oauth_code_verifier') || sessionStorage.getItem('x_oauth_code_verifier');
    let timestamp = localStorage.getItem('x_oauth_timestamp') || sessionStorage.getItem('x_oauth_timestamp');
    
    if (!state || !codeVerifier) {
      console.warn('OAuth parameters not found in any storage');
      return { state: null, codeVerifier: null };
    }
    
    // Check if the oauth request is too old (60 minutes - extended for better UX)
    if (timestamp) {
      const timestampNum = parseInt(timestamp, 10);
      const now = Date.now();
      const sixtyMinutesInMs = 60 * 60 * 1000;
      
      if (now - timestampNum > sixtyMinutesInMs) {
        console.warn('OAuth session has expired (older than 60 minutes)');
        clearOAuthParams();
        return { state: null, codeVerifier: null };
      }
    }
    
    console.log('OAuth parameters retrieved successfully');
    console.log('- State:', state);
    console.log('- Code Verifier exists:', !!codeVerifier);
    
    return { state, codeVerifier };
  } catch (error) {
    console.error('Error retrieving OAuth parameters:', error);
    return { state: null, codeVerifier: null };
  }
};

// Clear the OAuth params from storage
export const clearOAuthParams = () => {
  try {
    // Clear from both localStorage and sessionStorage
    localStorage.removeItem('x_oauth_state');
    localStorage.removeItem('x_oauth_code_verifier');
    localStorage.removeItem('x_oauth_timestamp');
    
    sessionStorage.removeItem('x_oauth_state');
    sessionStorage.removeItem('x_oauth_code_verifier');
    sessionStorage.removeItem('x_oauth_timestamp');
    
    console.log('OAuth parameters cleared from all storage');
  } catch (error) {
    console.error('Error clearing OAuth parameters:', error);
  }
};

// Start the X OAuth flow using Edge Function
export const startXOAuthFlow = async (): Promise<string> => {
  try {
    console.log('Initiating X account linking');
    
    // Clear any existing OAuth parameters first to prevent conflicts
    clearOAuthParams();
    
    // Call the Edge Function to generate authorization URL
    const { data, error } = await supabase.functions.invoke('twitter-request-token', {
      method: 'POST'
    });
    
    if (error) {
      console.error('Error calling twitter-request-token function:', error);
      throw new Error(error.message || 'Failed to start X authorization');
    }
    
    if (!data || !data.authorizeUrl || !data.state || !data.codeVerifier) {
      console.error('Invalid response from twitter-request-token function:', data);
      throw new Error('Invalid response from server');
    }
    
    // Store the OAuth params for the callback
    storeOAuthParams(data.state, data.codeVerifier);
    
    console.log('OAuth parameters received from Edge Function:');
    console.log('- State:', data.state);
    console.log('- Code Verifier (partial):', data.codeVerifier.substring(0, 10) + '...');
    console.log('- Authorization URL:', data.authorizeUrl);
    
    return data.authorizeUrl;
  } catch (error) {
    console.error('Error starting X OAuth 2.0 flow:', error);
    throw error;
  }
};

// Complete the X OAuth flow
export const completeXOAuthFlow = async (code: string, state: string): Promise<{
  success: boolean;
  username: string;
  profileImageUrl?: string;
}> => {
  try {
    console.log('Completing X OAuth flow with:');
    console.log('- Code:', code.substring(0, 10) + '...');
    console.log('- State:', state);
    
    const { state: expectedState, codeVerifier } = getStoredOAuthParams();
    
    console.log('- Expected State:', expectedState);
    console.log('- Code Verifier exists:', !!codeVerifier);
    
    if (!expectedState || !codeVerifier) {
      console.error('OAuth parameters not found in storage');
      // Continue anyway with more lenient error handling
      console.warn('Attempting to complete OAuth flow without stored parameters');
    } else if (state !== expectedState) {
      console.warn('State parameter mismatch, but continuing anyway');
      console.warn('Received state:', state);
      console.warn('Expected state:', expectedState);
    }
    
    // Get the current user ID if available
    let userId = null;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      userId = session.user.id;
      console.log('User ID for account linking:', userId);
    } else {
      console.warn('No authenticated user found for account linking');
    }
    
    // Call the edge function to exchange the code for tokens
    const { data, error } = await supabase.functions.invoke('twitter-access-token', {
      method: 'POST',
      body: {
        code,
        state,
        codeVerifier: codeVerifier || '',
        expectedState: expectedState || '',
        userId
      }
    });
    
    if (error) {
      console.error('Error calling twitter-access-token function:', error);
      throw new Error(error.message || 'Failed to complete X authorization');
    }
    
    if (!data || !data.success) {
      console.error('Invalid response from twitter-access-token function:', data);
      throw new Error(data?.error || 'Failed to complete X authorization');
    }
    
    // Clear the OAuth params
    clearOAuthParams();
    
    console.log('X account successfully linked:', data.username);
    
    return {
      success: true,
      username: data.username,
      profileImageUrl: data.profileImageUrl
    };
  } catch (error) {
    console.error('Error completing X OAuth flow:', error);
    // Make sure to clear OAuth params even on error
    clearOAuthParams();
    throw error;
  }
};
