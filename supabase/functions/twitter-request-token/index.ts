
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as crypto from 'https://deno.land/std@0.165.0/node/crypto.ts';
import { OAuth2Client } from 'https://deno.land/x/oauth2_client/mod.ts';

interface RequestBody {
  userId?: string;
  isLogin?: boolean;
  origin: string;
}

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    console.log('Twitter request token function invoked');
    
    // CORS headers for preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
        status: 204,
      });
    }
    
    // Parse request body
    const { userId, isLogin = false, origin } = await req.json() as RequestBody;
    console.log('Request parameters:', { userId, isLogin, origin });
    
    // Initialize OAuth2 client
    const client = new OAuth2Client({
      clientId: Deno.env.get('TWITTER_CLIENT_ID') || '',
      clientSecret: Deno.env.get('TWITTER_CLIENT_SECRET') || '',
      authorizationEndpointUri: 'https://twitter.com/i/oauth2/authorize',
      tokenUri: 'https://api.twitter.com/2/oauth2/token',
      redirectUri: Deno.env.get('TWITTER_CALLBACK_URL') || '',
      defaults: {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      },
    });
    
    // Generate OAuth state and PKCE verifier
    const state = crypto.randomBytes(32).toString('hex');
    const codeVerifier = crypto.randomBytes(64).toString('hex');
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get OAuth authorization URL
    const { uri: authUrl } = await client.code.getAuthorizationUri({
      state,
      codeVerifier,
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    });
    
    // Store OAuth state in database
    const tempId = crypto.randomBytes(16).toString('hex');
    const storeUser = isLogin ? `temp-${tempId}` : userId;
    
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
        callback_url: origin + '/x-callback?type=' + (isLogin ? 'login' : 'link'),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes expiry
      });
    
    if (storeError) {
      console.error('Failed to store OAuth state:', storeError);
      throw new Error(`Failed to store OAuth state: ${storeError.message}`);
    }
    
    return new Response(
      JSON.stringify({
        authUrl: authUrl.toString(),
        state,
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
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
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 500,
      }
    );
  }
});
