
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
    // Get the session first
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    
    if (!accessToken) {
      throw new Error('User not authenticated');
    }

    // Call the edge function to get a request token
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twitter-request-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from twitter-request-token:', errorText);
      throw new Error(`Failed to get request token: ${response.status}`);
    }

    const data = await response.json();
    
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
    
    if (!requestToken || !requestTokenSecret) {
      throw new Error('OAuth tokens not found');
    }

    // Get the session first
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const user = sessionData.session?.user;
    
    if (!accessToken || !user) {
      throw new Error('User not authenticated');
    }

    // Call the edge function to get an access token
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twitter-access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token: requestToken,
        verifier: oauthVerifier,
        tokenSecret: requestTokenSecret,
        userId: user.id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from twitter-access-token:', errorText);
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    
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
