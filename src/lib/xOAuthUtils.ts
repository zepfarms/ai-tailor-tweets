
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

// Generate a code verifier for PKCE
const generateCodeVerifier = (): string => {
  return generateRandomString(64);
};

// Generate a code challenge from a code verifier
const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  // Use the subtle crypto API to hash the code verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Convert the hash to base64url encoding
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

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
    const state = generateRandomString(32);
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    console.log('OAuth 2.0 Flow Parameters:');
    console.log('- State:', state);
    console.log('- Code Verifier:', codeVerifier.substring(0, 10) + '...');
    console.log('- Code Challenge:', codeChallenge.substring(0, 10) + '...');
    
    // Store the state and code verifier
    storeOAuthParams(state, codeVerifier);
    
    // OAuth 2.0 parameters
    const clientId = import.meta.env.VITE_TWITTER_CLIENT_ID || 'mock_client_id';
    const redirectUri = import.meta.env.VITE_TWITTER_CALLBACK_URL || window.location.origin + '/x-callback';
    console.log('Using redirect URI:', redirectUri);
    
    // Construct the authorization URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'tweet.read tweet.write users.read offline.access');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    
    const authorizeUrl = authUrl.toString();
    console.log('Generated authorization URL:', authorizeUrl);
    
    return authorizeUrl;
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
    
    if (state !== expectedState) {
      throw new Error('State mismatch - potential CSRF attack');
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

    // Call the token exchange endpoint directly from the client
    // In a real production app, you should do this server-side to protect your client secret
    const clientId = import.meta.env.VITE_TWITTER_CLIENT_ID || 'mock_client_id';
    const clientSecret = import.meta.env.VITE_TWITTER_CLIENT_SECRET || 'mock_client_secret';
    const redirectUri = import.meta.env.VITE_TWITTER_CALLBACK_URL || window.location.origin + '/x-callback';
    
    // For local development/demo, we'll exchange the code for a token directly
    // Note: In production, this should be done on the server side
    console.log('Exchanging code for token with code verifier:', codeVerifier.substring(0, 10) + '...');
    
    // Simulate successful token exchange and user info fetching for demo purposes
    // In a real app, you would make an actual API call to Twitter
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    // For demo, we'll just return mock data
    // In a real app, you would be making actual API calls to Twitter
    const mockUsername = "TwitterUser" + Math.floor(Math.random() * 1000);
    
    // Clear the OAuth params
    clearOAuthParams();
    
    return {
      success: true,
      username: mockUsername,
      profileImageUrl: `https://ui-avatars.com/api/?name=${mockUsername}&background=random`,
    };
  } catch (error) {
    console.error('Error completing X OAuth 2.0 flow:', error);
    throw error;
  }
};
