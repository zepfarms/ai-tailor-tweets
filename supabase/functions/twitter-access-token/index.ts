
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface RequestBody {
  code: string;
  state: string;
  callbackType?: string;
}

serve(async (req) => {
  try {
    console.log('Twitter access token function invoked');
    
    // Parse request body
    const { code, state, callbackType = 'link' } = await req.json() as RequestBody;
    console.log('Request parameters:', { code, state, callbackType });
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get stored OAuth state
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single();
    
    if (stateError || !oauthState) {
      console.error('Failed to retrieve OAuth state:', stateError);
      throw new Error('Invalid or expired OAuth state');
    }
    
    // Check if state is still valid
    if (new Date(oauthState.expires_at) < new Date()) {
      throw new Error('OAuth state has expired');
    }
    
    // Exchange code for access token
    const clientId = Deno.env.get('TWITTER_CLIENT_ID');
    const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET');
    const redirectUri = Deno.env.get('TWITTER_CALLBACK_URL');
    
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Twitter credentials not properly configured');
    }
    
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: oauthState.code_verifier
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token response error:', errorText);
      throw new Error(`Failed to exchange code for tokens: ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Token data received');
    
    // Get user info from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('User info response error:', errorText);
      throw new Error(`Failed to get user info: ${errorText}`);
    }
    
    const userData = await userResponse.json();
    const userId = userData.data.id;
    const username = userData.data.username;
    
    console.log('User data received:', { userId, username });
    
    // For login flow
    if (oauthState.is_login) {
      console.log('Processing login flow');
      
      // Create a magic link for email-less authentication
      const magicLink = `x-login:${username}:${userId}:${Math.random().toString(36).substring(2)}`;
      
      // Return the magic link for the client to complete authentication
      return new Response(
        JSON.stringify({
          username,
          userId,
          magicLink
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // For account linking flow
    console.log('Processing account linking flow');
    console.log('User ID from oauth state:', oauthState.user_id);
    
    // Store tokens in database
    const { error: tokenStoreError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: oauthState.user_id,
        provider: 'twitter',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      }, { onConflict: 'user_id,provider' });
    
    if (tokenStoreError) {
      console.error('Failed to store tokens:', tokenStoreError);
      throw new Error(`Failed to store tokens: ${tokenStoreError.message}`);
    }
    
    // Store X account details
    const { error: xAccountError } = await supabase
      .from('x_accounts')
      .upsert({
        user_id: oauthState.user_id,
        x_user_id: userId,
        x_username: username,
        access_token: tokenData.access_token,
        access_token_secret: tokenData.refresh_token || '',
        profile_image_url: ''
      }, { onConflict: 'user_id' });
    
    if (xAccountError) {
      console.error('Failed to store X account:', xAccountError);
      throw new Error(`Failed to store X account: ${xAccountError.message}`);
    }
    
    // Update user metadata to indicate X is linked
    const { data: userData2, error: userError } = await supabase.auth.admin.updateUserById(
      oauthState.user_id,
      {
        user_metadata: {
          xLinked: true,
          xUsername: username
        }
      }
    );
    
    if (userError) {
      console.error('Failed to update user metadata:', userError);
      // This is not a critical error, so we continue
    }
    
    // Delete used OAuth state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);
    
    return new Response(
      JSON.stringify({
        success: true,
        username
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in twitter-access-token:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to complete X authentication',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
