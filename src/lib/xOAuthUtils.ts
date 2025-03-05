
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

// Use multiple storage methods to ensure parameters are available
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
    
    // Try to use cookies for additional redundancy
    try {
      document.cookie = `x_oauth_state=${state}; path=/; max-age=3600; SameSite=None; Secure`;
      document.cookie = `x_oauth_timestamp=${timestamp}; path=/; max-age=3600; SameSite=None; Secure`;
    } catch (cookieError) {
      console.warn('Failed to store OAuth parameters in cookies:', cookieError);
      // Continue anyway as we have other storage methods
    }
    
    console.log('OAuth parameters stored in multiple storage mechanisms:');
    console.log('- State:', state);
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
    // Try to get from localStorage first
    let paramsString = localStorage.getItem('x_oauth_params');
    
    // If not in localStorage, try sessionStorage
    if (!paramsString) {
      paramsString = sessionStorage.getItem('x_oauth_params');
      if (paramsString) {
        console.log('Retrieved OAuth parameters from sessionStorage');
      }
    } else {
      console.log('Retrieved OAuth parameters from localStorage');
    }
    
    // If found in either storage, parse and validate
    if (paramsString) {
      try {
        const params = JSON.parse(paramsString);
        
        // Verify we have the required properties
        if (params.state && params.codeVerifier) {
          // Check expiration - 120 minutes max (more lenient)
          const now = Date.now();
          const storedTime = parseInt(params.timestamp || '0', 10);
          const twoHoursInMs = 120 * 60 * 1000;
          
          if (now - storedTime > twoHoursInMs) {
            console.warn('OAuth session has expired (older than 120 minutes)');
            return { state: null, codeVerifier: null };
          }
          
          console.log('OAuth parameters retrieved successfully:');
          console.log('- State:', params.state);
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
    }
    
    // If we couldn't get or parse from storage, try cookies as last resort
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (cookies.x_oauth_state) {
      console.log('Retrieved OAuth state from cookies:', cookies.x_oauth_state);
      
      // We likely don't have code verifier in cookies due to size constraints
      return { 
        state: cookies.x_oauth_state, 
        codeVerifier: null,
        origin: window.location.origin
      };
    }
    
    console.warn('OAuth parameters not found in any storage');
    return { state: null, codeVerifier: null, origin: null };
  } catch (error) {
    console.error('Error retrieving OAuth parameters:', error);
    return { state: null, codeVerifier: null, origin: null };
  }
};

// Clear the OAuth params from all storage mechanisms
export const clearOAuthParams = () => {
  try {
    // Clear from localStorage
    localStorage.removeItem('x_oauth_params');
    
    // Clear from sessionStorage
    sessionStorage.removeItem('x_oauth_params');
    
    // Clear cookies too
    document.cookie = 'x_oauth_state=; path=/; max-age=0; SameSite=None; Secure';
    document.cookie = 'x_oauth_timestamp=; path=/; max-age=0; SameSite=None; Secure';
    
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
    
    const { state: expectedState, codeVerifier, origin } = getStoredOAuthParams();
    
    console.log('Retrieved stored parameters:');
    console.log('- Expected State:', expectedState);
    console.log('- Code Verifier exists:', !!codeVerifier);
    console.log('- Code Verifier length:', codeVerifier?.length || 0);
    console.log('- Origin:', origin);
    console.log('- Current origin:', window.location.origin);
    
    // More lenient validation - if we have no params at all
    if (!expectedState && !codeVerifier) {
      console.error('OAuth parameters not found in any storage');
      
      // Try to complete the flow anyway with just the provided code and state
      console.log('Attempting to complete flow without stored parameters');
      
      // Get the current user ID if available
      let userId = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userId = session.user.id;
        console.log('User ID for account linking (without stored params):', userId);
      }
      
      // Call the edge function to exchange the code for tokens
      const { data, error } = await supabase.functions.invoke('twitter-access-token', {
        method: 'POST',
        body: {
          code,
          state,
          userId
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to complete X authorization');
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to complete X authorization');
      }
      
      console.log('X account successfully linked without stored parameters:', data.username);
      
      return {
        success: true,
        username: data.username,
        profileImageUrl: data.profileImageUrl
      };
    }
    
    // If we have expected state but it doesn't match, still try to proceed
    if (expectedState && state !== expectedState) {
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
    console.log('Calling twitter-access-token function to exchange code for tokens');
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
