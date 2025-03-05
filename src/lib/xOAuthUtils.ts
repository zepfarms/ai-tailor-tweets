
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

// Store the OAuth state and code verifier using multiple storage mechanisms
export const storeOAuthParams = (state: string, codeVerifier: string) => {
  try {
    console.log('Storing OAuth parameters with enhanced persistence');
    
    // Store data with timestamp
    const oauthData = {
      state,
      codeVerifier,
      timestamp: Date.now()
    };
    
    // Try multiple storage methods to ensure persistence
    
    // 1. Store in session storage (primary method)
    sessionStorage.setItem('x_oauth_state', state);
    sessionStorage.setItem('x_oauth_code_verifier', codeVerifier);
    sessionStorage.setItem('x_oauth_timestamp', Date.now().toString());
    
    // 2. Backup in localStorage
    localStorage.setItem('x_oauth_backup', JSON.stringify(oauthData));
    
    // 3. Store in a cookie as another fallback (expires in 15 minutes)
    document.cookie = `x_oauth_data=${encodeURIComponent(JSON.stringify(oauthData))}; max-age=900; path=/`;
    
    console.log('OAuth parameters stored using multiple persistence methods');
    console.log('- State:', state);
    console.log('- Code Verifier (partial):', codeVerifier.substring(0, 10) + '...');
  } catch (error) {
    console.error('Error storing OAuth parameters:', error);
    
    // Last resort fallback
    try {
      localStorage.setItem('x_oauth_backup', JSON.stringify({
        state,
        codeVerifier,
        timestamp: Date.now()
      }));
    } catch (fallbackError) {
      console.error('All storage methods failed:', fallbackError);
    }
  }
};

// Retrieve the OAuth state and code verifier from all available storage methods
export const getStoredOAuthParams = () => {
  try {
    console.log('Retrieving OAuth parameters using multiple recovery methods');
    
    // Check timestamp to expire old OAuth attempts (15 minute maximum)
    const MAX_AGE = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    // Try session storage first (primary storage method)
    let state = sessionStorage.getItem('x_oauth_state');
    let codeVerifier = sessionStorage.getItem('x_oauth_code_verifier');
    let timestamp = sessionStorage.getItem('x_oauth_timestamp');
    let storageMethod = 'sessionStorage';
    
    // If session storage method didn't work, try localStorage backup
    if (!state || !codeVerifier) {
      console.log('Session storage retrieval failed, trying localStorage backup');
      const backupData = localStorage.getItem('x_oauth_backup');
      
      if (backupData) {
        try {
          const parsed = JSON.parse(backupData);
          state = parsed.state;
          codeVerifier = parsed.codeVerifier;
          timestamp = parsed.timestamp.toString();
          storageMethod = 'localStorage';
        } catch (e) {
          console.error('Error parsing localStorage backup:', e);
        }
      }
    }
    
    // If localStorage backup didn't work, try cookie fallback
    if (!state || !codeVerifier) {
      console.log('localStorage retrieval failed, trying cookie backup');
      const cookies = document.cookie.split(';');
      const oauthCookie = cookies.find(c => c.trim().startsWith('x_oauth_data='));
      
      if (oauthCookie) {
        try {
          const cookieValue = decodeURIComponent(oauthCookie.split('=')[1].trim());
          const parsed = JSON.parse(cookieValue);
          state = parsed.state;
          codeVerifier = parsed.codeVerifier;
          timestamp = parsed.timestamp.toString();
          storageMethod = 'cookie';
        } catch (e) {
          console.error('Error parsing cookie backup:', e);
        }
      }
    }
    
    // Check if the OAuth attempt is too old
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age > MAX_AGE) {
        console.log('OAuth parameters expired (older than 15 minutes)');
        return { state: null, codeVerifier: null };
      }
    }
    
    if (state && codeVerifier) {
      console.log(`Successfully retrieved OAuth parameters from ${storageMethod}`);
      console.log('- State:', state);
      console.log('- Code Verifier (partial):', codeVerifier.substring(0, 10) + '...');
    } else {
      console.log('Failed to retrieve OAuth parameters from any storage method');
    }
    
    return { state, codeVerifier };
  } catch (error) {
    console.error('Error retrieving OAuth parameters:', error);
    return { state: null, codeVerifier: null };
  }
};

// Clear the OAuth params from all storage methods
export const clearOAuthParams = () => {
  try {
    console.log('Clearing OAuth parameters from all storage methods');
    
    // Clear session storage
    sessionStorage.removeItem('x_oauth_state');
    sessionStorage.removeItem('x_oauth_code_verifier');
    sessionStorage.removeItem('x_oauth_timestamp');
    
    // Clear localStorage backup
    localStorage.removeItem('x_oauth_backup');
    
    // Clear cookie
    document.cookie = 'x_oauth_data=; max-age=0; path=/';
    
    console.log('Successfully cleared all OAuth parameters');
  } catch (error) {
    console.error('Error clearing OAuth parameters:', error);
  }
};

// Start the X OAuth flow using Edge Function
export const startXOAuthFlow = async (): Promise<string> => {
  try {
    console.log('Initiating X account linking with improved OAuth flow');
    
    // Clear any existing OAuth parameters first
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
    
    // Store the OAuth params for the callback using enhanced persistence
    storeOAuthParams(data.state, data.codeVerifier);
    
    // Also store current user info if available for auth continuation
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      localStorage.setItem('auth_redirect_user', JSON.stringify(user));
    }
    
    console.log('OAuth flow initiated successfully');
    console.log('Authorization URL:', data.authorizeUrl);
    
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
    console.log('- Code:', code);
    console.log('- State from URL:', state);
    
    const { state: expectedState, codeVerifier } = getStoredOAuthParams();
    
    console.log('- Expected State from storage:', expectedState);
    console.log('- Code Verifier exists:', !!codeVerifier);
    
    if (!expectedState || !codeVerifier) {
      console.error('OAuth parameters not found in any storage method');
      throw new Error('Authentication session expired. Please try again.');
    }
    
    if (state !== expectedState) {
      console.error('State parameter mismatch', {
        received: state,
        expected: expectedState
      });
      throw new Error('Security verification failed. Please try again.');
    }
    
    // Get the current user ID if available
    let userId = null;
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.id) {
      userId = user.id;
      console.log('User ID for account linking:', userId);
    } else {
      // Try to get from the auth_redirect_user
      const redirectUser = JSON.parse(localStorage.getItem('auth_redirect_user') || 'null');
      if (redirectUser && redirectUser.id) {
        userId = redirectUser.id;
        console.log('User ID from redirect storage:', userId);
      }
    }
    
    // Call the edge function to exchange the code for tokens
    const { data, error } = await supabase.functions.invoke('twitter-access-token', {
      method: 'POST',
      body: {
        code,
        state,
        codeVerifier,
        expectedState,
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
