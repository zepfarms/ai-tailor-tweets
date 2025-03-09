
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as crypto from 'https://deno.land/std@0.165.0/node/crypto.ts';

interface RequestBody {
  userId?: string;
  isLogin?: boolean;
  origin: string;
}

serve(async (req) => {
  try {
    console.log('Twitter request token function invoked');
    
    // Parse request body
    const { userId, isLogin = false, origin } = await req.json() as RequestBody;
    console.log('Request parameters:', { userId, isLogin, origin });
    
    // Generate OAuth state and PKCE verifier
    const state = crypto.randomBytes(32).toString('hex');
    const codeVerifier = crypto.randomBytes(64).toString('hex');
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Determine callback URL - for both login and account linking
    const callbackUrl = isLogin
      ? `${origin}/x-callback?type=login`
      : `${origin}/x-callback?type=link`;
    
    console.log('Generated state:', state);
    console.log('Callback URL:', callbackUrl);
    
    // Get Twitter client ID
    const clientId = Deno.env.get('TWITTER_CLIENT_ID');
    if (!clientId) {
      throw new Error('Twitter client ID not configured');
    }
    
    // Store OAuth state in database
    // For login flows, use a temporary ID since we don't have a user yet
    const storeUser = isLogin ? 'temp-auth-user' : userId;
    
    if (!storeUser) {
      throw new Error('User ID is required for account linking');
    }
    
    const { error: storeError } = await supabase
      .from('oauth_states')
      .insert({
        user_id: storeUser,
        provider: 'twitter',
        state,
        code_verifier: codeVerifier,
        is_login: isLogin,
        callback_url: callbackUrl,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes expiry
      });
    
    if (storeError) {
      console.error('Failed to store OAuth state:', storeError);
      throw new Error(`Failed to store OAuth state: ${storeError.message}`);
    }
    
    // Generate Twitter OAuth URL
    const scope = 'tweet.read tweet.write users.read offline.access';
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', Deno.env.get('TWITTER_CALLBACK_URL') || '');
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeVerifier);
    authUrl.searchParams.append('code_challenge_method', 'plain');
    
    return new Response(
      JSON.stringify({
        authUrl: authUrl.toString(),
        state
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in twitter-request-token:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to initialize X authentication',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
