
// This file contains utilities for X (Twitter) OAuth authentication

import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a random state parameter for OAuth security
 */
export const generateOAuthState = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Starts the X OAuth flow by calling the Supabase Edge Function
 */
export const startXOAuthFlow = async (): Promise<string> => {
  try {
    console.log("Starting X OAuth flow via edge function");
    
    // Call the edge function to get authorization URL and state
    const { data, error } = await supabase.functions.invoke("twitter-request-token", {
      method: "POST"
    });
    
    if (error) {
      console.error("Error calling twitter-request-token function:", error);
      throw new Error(`Failed to start X authorization: ${error.message}`);
    }
    
    if (!data || !data.authorizeUrl || !data.state || !data.codeVerifier) {
      console.error("Invalid response from twitter-request-token function:", data);
      throw new Error("Invalid response from OAuth initialization");
    }
    
    // Store OAuth parameters in localStorage
    localStorage.setItem('x_oauth_state', data.state);
    localStorage.setItem('x_oauth_code_verifier', data.codeVerifier);
    
    console.log("X OAuth flow initialized successfully");
    
    return data.authorizeUrl;
  } catch (error) {
    console.error("Error in startXOAuthFlow:", error);
    throw error;
  }
};

/**
 * Validates the OAuth state parameter
 */
export const validateOAuthState = (receivedState: string): boolean => {
  const storedState = localStorage.getItem('x_oauth_state');
  return storedState === receivedState;
};

/**
 * Extracts OAuth code from URL
 */
export const extractOAuthCode = (url: string): string | null => {
  const urlObj = new URL(url);
  return urlObj.searchParams.get('code');
};

/**
 * Clears OAuth parameters from localStorage
 */
export const clearOAuthParams = (): void => {
  localStorage.removeItem('x_oauth_state');
  localStorage.removeItem('x_oauth_code_verifier');
};

/**
 * Exchanges the OAuth code for an access token
 */
export const exchangeCodeForToken = async (
  code: string, 
  codeVerifier: string,
  userId: string
): Promise<{ success: boolean; username?: string; error?: string }> => {
  try {
    console.log("Exchanging OAuth code for token with codeVerifier length:", codeVerifier.length);
    console.log("userId:", userId);
    
    const response = await supabase.functions.invoke('twitter-access-token', {
      body: {
        code,
        state: localStorage.getItem('x_oauth_state'),
        codeVerifier,
        expectedState: localStorage.getItem('x_oauth_state'),
        userId
      }
    });
    
    if (response.error) {
      console.error("Error from twitter-access-token function:", response.error);
      throw new Error(response.error.message || 'Error getting access token');
    }
    
    console.log("Twitter access token response:", response.data);
    
    return {
      success: true,
      username: response.data.username
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
