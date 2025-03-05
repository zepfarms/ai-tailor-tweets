
// Utilities for X (Twitter) OAuth 2.0 process
import { supabase } from "@/integrations/supabase/client";

// Store the OAuth state and code verifier in session storage
export const storeOAuthParams = (state: string, codeVerifier: string) => {
  sessionStorage.setItem('x_oauth_state', state);
  sessionStorage.setItem('x_oauth_code_verifier', codeVerifier);
};

// Retrieve the OAuth state and code verifier from session storage
export const getStoredOAuthParams = () => {
  const state = sessionStorage.getItem('x_oauth_state');
  const codeVerifier = sessionStorage.getItem('x_oauth_code_verifier');
  return { state, codeVerifier };
};

// Clear the OAuth params from session storage
export const clearOAuthParams = () => {
  sessionStorage.removeItem('x_oauth_state');
  sessionStorage.removeItem('x_oauth_code_verifier');
};

// Start the X OAuth flow
export const startXOAuthFlow = async (): Promise<string> => {
  try {
    // For the mock user case - use a mock access token if there's no real session
    // This is necessary because we're using a mock user flow in the application
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Session data:', sessionData);
    
    // Check if we have a real session with access token, or if we're using the mock user
    let accessToken = sessionData.session?.access_token;
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!accessToken && user) {
      // We're using a mock user, so use a placeholder token
      console.log('Using mock authentication for user:', user.name);
      accessToken = 'mock_token_for_development';
    }
    
    if (!accessToken) {
      throw new Error('User not authenticated');
    }

    console.log('Starting X OAuth 2.0 flow with access token:', accessToken.substring(0, 10) + '...');
    
    // Call the edge function to start the OAuth 2.0 process
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rsbzrlvezpcejzyvkmpx.supabase.co';
    console.log('Using Supabase URL:', supabaseUrl);
    
    const functionUrl = `${supabaseUrl}/functions/v1/twitter-request-token`;
    console.log('Calling edge function at URL:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from twitter-request-token:', errorText);
      throw new Error(`Failed to start OAuth flow: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Received OAuth 2.0 authorization data:', data);
    
    if (!data.authorizeUrl || !data.state || !data.codeVerifier) {
      console.error('Invalid response data:', data);
      throw new Error('Invalid response from OAuth 2.0 authorization endpoint');
    }
    
    console.log('Received OAuth 2.0 state:', data.state);
    console.log('Authorize URL:', data.authorizeUrl);
    
    // Store the OAuth params
    storeOAuthParams(data.state, data.codeVerifier);
    
    // Return the authorization URL
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
    const { state: expectedState, codeVerifier } = getStoredOAuthParams();
    
    console.log('Completing X OAuth 2.0 flow with:');
    console.log('- Authorization code:', code);
    console.log('- State:', state);
    console.log('- Expected state:', expectedState);
    
    if (!expectedState || !codeVerifier) {
      throw new Error('OAuth parameters not found');
    }

    // For the mock user case - use a mock access token if there's no real session
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Session data for completing OAuth:', sessionData);
    
    // Check if we have a real session with access token, or if we're using the mock user
    let accessToken = sessionData.session?.access_token;
    let userId = sessionData.session?.user?.id;
    
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!accessToken && user) {
      // We're using a mock user, so use a placeholder token and ID
      console.log('Using mock authentication for user completion:', user.name);
      accessToken = 'mock_token_for_development';
      userId = user.id;
    }
    
    if (!accessToken || !userId) {
      throw new Error('User not authenticated');
    }

    console.log('User ID for X account linking:', userId);

    // Call the edge function to exchange the code for an access token
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rsbzrlvezpcejzyvkmpx.supabase.co';
    console.log('Using Supabase URL for completing OAuth:', supabaseUrl);
    
    console.log('Calling twitter-access-token endpoint with authorization code');
    const response = await fetch(`${supabaseUrl}/functions/v1/twitter-access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        code,
        state,
        codeVerifier,
        expectedState,
        userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from twitter-access-token:', errorText);
      throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('X OAuth 2.0 completion response:', data);
    
    if (!data.success || !data.username) {
      console.error('Invalid response data from access token endpoint:', data);
      throw new Error('Invalid response from access token endpoint');
    }
    
    console.log('X OAuth successfully completed for username:', data.username);
    
    // Clear the tokens
    clearOAuthParams();
    
    return {
      success: data.success,
      username: data.username,
      profileImageUrl: data.profileImageUrl,
    };
  } catch (error) {
    console.error('Error completing X OAuth 2.0 flow:', error);
    throw error;
  }
};
