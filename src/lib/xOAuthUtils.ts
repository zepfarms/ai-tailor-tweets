
// Utilities for X (Twitter) OAuth process
import { supabase } from "@/integrations/supabase/client";

// Store the OAuth request token and secret in session storage
export const storeOAuthTokens = (requestToken: string, requestTokenSecret: string) => {
  sessionStorage.setItem('x_request_token', requestToken);
  sessionStorage.setItem('x_request_token_secret', requestTokenSecret);
};

// Retrieve the OAuth token and secret from session storage
export const getStoredOAuthTokens = () => {
  const requestToken = sessionStorage.getItem('x_request_token');
  const requestTokenSecret = sessionStorage.getItem('x_request_token_secret');
  return { requestToken, requestTokenSecret };
};

// Clear the OAuth tokens from session storage
export const clearOAuthTokens = () => {
  sessionStorage.removeItem('x_request_token');
  sessionStorage.removeItem('x_request_token_secret');
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

    console.log('Starting X OAuth flow with access token:', accessToken.substring(0, 10) + '...');
    
    // Call the edge function to get a request token
    // Fix: Use the correct URL format for the edge function with project ID
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rsbzrlvezpcejzyvkmpx.supabase.co';
    console.log('Using Supabase URL:', supabaseUrl);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twitter-request-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from twitter-request-token:', errorText);
      throw new Error(`Failed to get request token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Received OAuth request token response:', data);
    
    if (!data.requestToken || !data.authorizeUrl) {
      console.error('Invalid response data:', data);
      throw new Error('Invalid response from request token endpoint');
    }
    
    console.log('Received OAuth request token:', data.requestToken);
    console.log('Authorize URL:', data.authorizeUrl);
    
    // Store the tokens
    storeOAuthTokens(data.requestToken, data.requestTokenSecret);
    
    // Return the authorization URL
    return data.authorizeUrl;
  } catch (error) {
    console.error('Error starting X OAuth flow:', error);
    throw error;
  }
};

// Complete the X OAuth flow
export const completeXOAuthFlow = async (oauthVerifier: string): Promise<{
  success: boolean;
  username: string;
  profileImageUrl?: string;
}> => {
  try {
    const { requestToken, requestTokenSecret } = getStoredOAuthTokens();
    
    console.log('Completing X OAuth flow with:');
    console.log('- Request token:', requestToken);
    console.log('- Verifier:', oauthVerifier);
    
    if (!requestToken || !requestTokenSecret) {
      throw new Error('OAuth tokens not found');
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

    // Call the edge function to get an access token
    // Fix: Use the correct URL format for the edge function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rsbzrlvezpcejzyvkmpx.supabase.co';
    console.log('Using Supabase URL for completing OAuth:', supabaseUrl);
    
    console.log('Calling twitter-access-token endpoint with request token and verifier');
    const response = await fetch(`${supabaseUrl}/functions/v1/twitter-access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token: requestToken,
        verifier: oauthVerifier,
        tokenSecret: requestTokenSecret,
        userId: userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from twitter-access-token:', errorText);
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('X OAuth completion response:', data);
    
    if (!data.success || !data.username) {
      console.error('Invalid response data from access token endpoint:', data);
      throw new Error('Invalid response from access token endpoint');
    }
    
    console.log('X OAuth successfully completed for username:', data.username);
    
    // Clear the tokens
    clearOAuthTokens();
    
    return {
      success: data.success,
      username: data.username,
      profileImageUrl: data.profileImageUrl,
    };
  } catch (error) {
    console.error('Error completing X OAuth flow:', error);
    throw error;
  }
};
