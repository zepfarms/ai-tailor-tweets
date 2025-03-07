
import { supabase } from '@/integrations/supabase/client';

export async function requestTwitterOAuth(userId: string) {
  try {
    console.log('Requesting Twitter OAuth with user ID:', userId);
    
    const { data, error } = await supabase.functions.invoke('twitter-request-token', {
      body: { userId },
    });

    if (error) {
      console.error('Error requesting Twitter OAuth:', error);
      throw new Error(`Failed to initialize X authentication: ${error.message}`);
    }

    if (!data?.authUrl) {
      console.error('No auth URL returned from Twitter OAuth request:', data);
      throw new Error('Failed to get X authorization URL');
    }

    console.log('Received Twitter auth URL, redirecting...');
    
    // Store the state in session storage before redirecting
    sessionStorage.setItem('twitter_oauth_state', data.state);
    sessionStorage.setItem('twitter_oauth_pending', 'true');
    sessionStorage.setItem('twitter_oauth_return_url', window.location.pathname);
    
    // Redirect to the Twitter OAuth page
    window.location.href = data.authUrl;
    return true;
  } catch (error) {
    console.error('Twitter OAuth request failed:', error);
    throw error;
  }
}

export async function processTwitterCallback(code: string, state: string) {
  try {
    console.log('Processing Twitter callback with code and state');
    
    // Verify state parameter matches the one we stored
    const storedState = sessionStorage.getItem('twitter_oauth_state');
    
    if (!storedState || storedState !== state) {
      console.error('State mismatch:', { storedState, receivedState: state });
      throw new Error('Security error: OAuth state parameter does not match');
    }
    
    // Clear state from storage
    sessionStorage.removeItem('twitter_oauth_state');
    sessionStorage.removeItem('twitter_oauth_pending');
    
    const { data, error } = await supabase.functions.invoke('twitter-access-token', {
      body: { code, state },
    });

    if (error) {
      console.error('Error processing Twitter callback:', error);
      throw new Error(`Failed to complete X authentication: ${error.message}`);
    }

    if (!data?.success) {
      console.error('Twitter callback unsuccessful:', data);
      throw new Error('Failed to connect X account');
    }

    const returnUrl = sessionStorage.getItem('twitter_oauth_return_url') || '/dashboard';
    sessionStorage.removeItem('twitter_oauth_return_url');
    
    console.log('Twitter OAuth successful, account linked');
    return { success: true, username: data.username, returnUrl };
  } catch (error) {
    console.error('Twitter callback processing failed:', error);
    throw error;
  }
}
