
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

// Multi-storage approach for OAuth parameters
export const storeOAuthParams = (state: string, codeVerifier: string) => {
  try {
    const timestamp = Date.now().toString();
    const origin = window.location.origin;
    const storeData = { state, codeVerifier, timestamp, origin };
    const storeDataString = JSON.stringify(storeData);
    
    // Use localStorage for persistent storage
    localStorage.setItem('x_oauth_params', storeDataString);
    
    // Create a backup in sessionStorage too in case localStorage is cleared
    sessionStorage.setItem('x_oauth_params', storeDataString);
    
    // Also try to use cookies for additional redundancy
    try {
      document.cookie = `x_oauth_state=${state}; path=/; max-age=7200; SameSite=Lax`;
      document.cookie = `x_oauth_timestamp=${timestamp}; path=/; max-age=7200; SameSite=Lax`;
      document.cookie = `x_oauth_has_params=true; path=/; max-age=7200; SameSite=Lax`;
    } catch (cookieError) {
      console.warn('Failed to store OAuth parameters in cookies:', cookieError);
    }
    
    console.log('OAuth parameters stored in multiple storage mechanisms:');
    console.log('- State:', state);
    console.log('- Code verifier length:', codeVerifier.length);
    console.log('- Origin:', origin);
    console.log('- Storage timestamp:', new Date(parseInt(timestamp)).toISOString());
  } catch (error) {
    console.error('Error storing OAuth parameters:', error);
    throw new Error('Failed to store OAuth parameters. Please ensure browser storage is enabled.');
  }
};

// Retrieve the OAuth state and code verifier from storage
export const getStoredOAuthParams = () => {
  try {
    console.log('Attempting to retrieve OAuth parameters');
    
    // Try to get from localStorage first
    let paramsString = localStorage.getItem('x_oauth_params');
    let source = 'localStorage';
    
    // If not in localStorage, try sessionStorage
    if (!paramsString) {
      paramsString = sessionStorage.getItem('x_oauth_params');
      source = 'sessionStorage';
    }
    
    // If found in either storage, parse and validate
    if (paramsString) {
      try {
        const params = JSON.parse(paramsString);
        console.log(`Retrieved OAuth parameters from ${source}:`, {
          stateExists: !!params.state,
          codeVerifierExists: !!params.codeVerifier,
          origin: params.origin
        });
        
        // Verify we have the required properties
        if (params.state && params.codeVerifier) {
          // Check expiration - 2 hours max (very lenient)
          const now = Date.now();
          const storedTime = parseInt(params.timestamp || '0', 10);
          const twoHoursInMs = 2 * 60 * 60 * 1000;
          
          if (now - storedTime > twoHoursInMs) {
            console.warn('OAuth session has expired (older than 2 hours)');
            clearOAuthParams(); // Clear expired params
            return { state: null, codeVerifier: null };
          }
          
          console.log('OAuth parameters are valid:');
          console.log('- State:', params.state);
          console.log('- Code verifier length:', params.codeVerifier.length);
          console.log('- Origin:', params.origin);
          console.log('- Session age:', Math.round((now - storedTime) / 1000 / 60), 'minutes');
          
          return { 
            state: params.state, 
            codeVerifier: params.codeVerifier,
            origin: params.origin
          };
        }
      } catch (parseError) {
        console.error('Error parsing OAuth parameters:', parseError);
      }
    } else {
      console.log(`No OAuth parameters found in ${source}`);
    }
    
    // If we couldn't get or parse from storage, try cookies as last resort
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (cookies.x_oauth_has_params) {
      console.log('Found cookie indicating OAuth parameters were stored');
      
      if (cookies.x_oauth_state) {
        console.log('Retrieved OAuth state from cookies:', cookies.x_oauth_state);
        
        // We don't store code verifier in cookies due to size limitations
        return { 
          state: cookies.x_oauth_state, 
          codeVerifier: null,
          origin: window.location.origin
        };
      }
    }
    
    console.warn('OAuth parameters not found in any storage mechanism');
    return { state: null, codeVerifier: null, origin: null };
  } catch (error) {
    console.error('Error retrieving OAuth parameters:', error);
    return { state: null, codeVerifier: null, origin: null };
  }
};

// Clear the OAuth params from all storage mechanisms
export const clearOAuthParams = () => {
  try {
    console.log('Clearing OAuth parameters from all storage mechanisms');
    
    // Clear from localStorage
    localStorage.removeItem('x_oauth_params');
    
    // Clear from sessionStorage
    sessionStorage.removeItem('x_oauth_params');
    
    // Clear cookies too
    document.cookie = 'x_oauth_state=; path=/; max-age=0;';
    document.cookie = 'x_oauth_timestamp=; path=/; max-age=0;';
    document.cookie = 'x_oauth_has_params=; path=/; max-age=0;';
    
    console.log('OAuth parameters cleared from all storage mechanisms');
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
      method: 'POST',
      body: { origin: window.location.origin }
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
    
    console.log('OAuth flow started successfully:');
    console.log('- State:', data.state);
    console.log('- Code Verifier (partial):', data.codeVerifier.substring(0, 10) + '...');
    
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
    console.log('- Code (partial):', code.substring(0, 10) + '...');
    console.log('- State:', state);
    
    // Get stored OAuth parameters, but continue even if they don't exist
    const { state: expectedState, codeVerifier, origin } = getStoredOAuthParams();
    
    // Get the current user ID if available
    let userId = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userId = session.user.id;
        console.log('User ID for account linking:', userId);
      } else {
        console.warn('No authenticated user found for account linking');
      }
    } catch (authError) {
      console.error('Error getting user session:', authError);
      // Continue anyway, we'll just skip account linking
    }
    
    // Call the edge function to exchange the code for tokens
    console.log('Calling twitter-access-token function with:');
    console.log('- Code verifier exists:', !!codeVerifier);
    console.log('- Expected state:', expectedState);
    console.log('- User ID:', userId);
    
    const { data, error } = await supabase.functions.invoke('twitter-access-token', {
      method: 'POST',
      body: {
        code,
        state,
        codeVerifier: codeVerifier || '',
        expectedState: expectedState || '',
        userId,
        origin: origin || window.location.origin
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
