
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
 * Generates a code verifier for PKCE OAuth flow
 */
export const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
};

/**
 * Creates a code challenge from the code verifier
 */
export const createCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Starts the X OAuth flow
 */
export const startXOAuthFlow = async (): Promise<string> => {
  const state = generateOAuthState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await createCodeChallenge(codeVerifier);
  
  localStorage.setItem('x_oauth_state', state);
  localStorage.setItem('x_oauth_code_verifier', codeVerifier);
  
  // URL encode the redirect URI
  const redirectUri = encodeURIComponent(`${window.location.origin}/x-callback`);
  const clientId = 'VFdFS0hxSUZoTXpsOXZVQmlpSUM6MTpjaQ'; // Twitter client ID
  
  const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.read%20users.read%20offline.access&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  
  return url;
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
      throw new Error(response.error.message || 'Error getting access token');
    }
    
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
