
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OAuth2Client } from 'https://deno.land/x/oauth2_client/mod.ts';

interface RequestBody {
  code: string;
  state: string;
  callbackType?: string;
}

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log('Twitter access token function invoked');
    
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
    
    // Initialize OAuth2 client
    const client = new OAuth2Client({
      clientId: Deno.env.get('TWITTER_CLIENT_ID') || '',
      clientSecret: Deno.env.get('TWITTER_CLIENT_SECRET') || '',
      authorizationEndpointUri: 'https://twitter.com/i/oauth2/authorize',
      tokenUri: 'https://api.twitter.com/2/oauth2/token',
      redirectUri: Deno.env.get('TWITTER_CALLBACK_URL') || '',
    });
    
    // Exchange code for tokens
    const tokens = await client.code.getToken(code, {
      codeVerifier: oauthState.code_verifier,
    });
    
    const accessToken = tokens.accessToken;
    const refreshToken = tokens.refreshToken;
    
    // Get user info from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info from Twitter');
    }
    
    const userData = await userResponse.json();
    const { data: { id: userId, username } } = userData;
    
    console.log('User data received:', { userId, username });
    
    // For login flow
    if (oauthState.is_login) {
      console.log('Processing login flow');
      
      const magicLink = `x-login:${username}:${userId}:${Math.random().toString(36).substring(2)}`;
      
      return new Response(
        JSON.stringify({
          username,
          userId,
          magicLink
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // For account linking flow
    console.log('Processing account linking flow');
    
    // Store tokens in database
    const { error: tokenStoreError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: oauthState.user_id,
        provider: 'twitter',
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7200 * 1000).toISOString() // 2 hours expiry
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
        x_user_id: userId.toString(),
        x_username: username,
        access_token: accessToken,
        access_token_secret: refreshToken || '',
        profile_image_url: userData.data.profile_image_url || ''
      }, { onConflict: 'user_id' });
    
    if (xAccountError) {
      console.error('Failed to store X account:', xAccountError);
      throw new Error(`Failed to store X account: ${xAccountError.message}`);
    }
    
    // Update user metadata
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
