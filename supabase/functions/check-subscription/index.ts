
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Checking subscription endpoint called");
    const { userId, sessionId } = await req.json();
    console.log(`Received request with userId: ${userId}, sessionId: ${sessionId || 'none'}`);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Special case for master user
    if (userId === "master_user_id" || userId === "demo-user-id") {
      console.log("Special case for master/demo user, returning active subscription");
      return new Response(
        JSON.stringify({ 
          hasActiveSubscription: true,
          subscription: {
            status: "active",
            isMasterUser: true
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if user is zepfarms@gmail.com (master user)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error("Error getting user data:", userError);
      throw userError;
    }
    
    if (userData?.user?.email === "zepfarms@gmail.com" || userData?.user?.email === "demo@postedpal.com") {
      console.log("Master user email detected, returning active subscription");
      return new Response(
        JSON.stringify({ 
          hasActiveSubscription: true,
          subscription: {
            status: "active",
            isMasterUser: true
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Check if 'subscriptions' table exists
    const { data: tableExists, error: tableError } = await supabase.rpc(
      'check_table_exists',
      { table_name: 'subscriptions' }
    );
    
    console.log("Table exists check:", tableExists, tableError);
    
    // If table doesn't exist, we'll create it
    if (tableError || !tableExists) {
      console.log("Subscriptions table doesn't exist, creating it");
      await supabase.rpc('create_subscriptions_table');
    }
    
    // If we have a session ID from redirect, verify it directly with Stripe
    if (sessionId) {
      try {
        console.log(`Verifying Stripe session ID: ${sessionId}`);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session && session.payment_status === 'paid' && session.status === 'complete') {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          
          // Create or update the subscription in the database
          await supabase.rpc('upsert_subscription', {
            user_id_param: userId,
            customer_id_param: customerId,
            subscription_id_param: subscriptionId,
            status_param: 'active',
            price_id_param: session.metadata?.price_id || ''
          });
          
          console.log(`Created/updated subscription for ${subscriptionId}`);
          
          return new Response(
            JSON.stringify({ 
              hasActiveSubscription: true,
              subscription: {
                status: 'active',
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: customerId,
                user_id: userId,
                verified_by_session: true
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      } catch (stripeError) {
        console.error("Error verifying Stripe session:", stripeError);
        // Continue with normal flow, just log the error
      }
    }

    // Check subscription status in database
    try {
      const { data: subscription, error: subError } = await supabase.rpc(
        'get_user_subscription',
        { user_id_param: userId }
      );
      
      console.log("Database subscription check:", subscription, subError);
      
      if (!subError && subscription && subscription.status === 'active') {
        return new Response(
          JSON.stringify({ 
            hasActiveSubscription: true,
            subscription: subscription
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } catch (dbError) {
      console.error("Error checking subscription in DB:", dbError);
    }

    // If no active subscription found yet, check with Stripe directly
    try {
      // Find customers by email
      if (userData?.user?.email) {
        console.log(`Looking up Stripe customer by email: ${userData.user.email}`);
        const customers = await stripe.customers.list({
          email: userData.user.email,
          limit: 1
        });
        
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          console.log(`Found Stripe customer: ${customerId}`);
          
          // Check for active subscriptions
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1
          });
          
          if (subscriptions.data.length > 0) {
            const stripeSubscription = subscriptions.data[0];
            console.log(`Found active Stripe subscription: ${stripeSubscription.id}`);
            
            // Save this subscription to our database
            await supabase.rpc('upsert_subscription', {
              user_id_param: userId,
              customer_id_param: customerId,
              subscription_id_param: stripeSubscription.id,
              status_param: 'active',
              price_id_param: stripeSubscription.items.data[0]?.price.id || ''
            });
            
            return new Response(
              JSON.stringify({ 
                hasActiveSubscription: true,
                subscription: {
                  status: 'active',
                  stripe_subscription_id: stripeSubscription.id,
                  stripe_customer_id: customerId,
                  user_id: userId,
                  verified_by_stripe_api: true
                }
              }),
              { 
                status: 200, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
              }
            );
          }
        }
      }
    } catch (stripeError) {
      console.error("Error checking with Stripe API:", stripeError);
    }

    console.log("No active subscription found for user");
    return new Response(
      JSON.stringify({ 
        hasActiveSubscription: false,
        subscription: null
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error checking subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to check subscription status" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
