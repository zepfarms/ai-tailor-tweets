
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
    const { userId } = await req.json();

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
      throw userError;
    }
    
    if (userData?.user?.email === "zepfarms@gmail.com") {
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
    
    // Check subscription status in database
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw error;
    }

    // If no active subscription is found in database, check directly with Stripe
    if (!subscription && userId) {
      try {
        // Find customer by user ID using metadata
        const { data: customerData, error: customerError } = await supabase
          .from("subscriptions")
          .select("stripe_customer_id, stripe_subscription_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (customerData?.stripe_subscription_id) {
          // Verify subscription status directly with Stripe
          const stripeSubscription = await stripe.subscriptions.retrieve(
            customerData.stripe_subscription_id
          );

          if (stripeSubscription.status === 'active') {
            // Update our database to match Stripe's data
            await supabase
              .from("subscriptions")
              .update({ 
                status: 'active',
                updated_at: new Date().toISOString() 
              })
              .eq("stripe_subscription_id", customerData.stripe_subscription_id);

            // Return active subscription
            return new Response(
              JSON.stringify({ 
                hasActiveSubscription: true,
                subscription: {
                  status: 'active',
                  stripe_subscription_id: customerData.stripe_subscription_id,
                  stripe_customer_id: customerData.stripe_customer_id,
                  user_id: userId
                }
              }),
              { 
                status: 200, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
              }
            );
          }
        }
      } catch (stripeError) {
        console.error("Error checking with Stripe:", stripeError);
        // Continue with normal flow, just log the error
      }
    }

    return new Response(
      JSON.stringify({ 
        hasActiveSubscription: !!subscription,
        subscription: subscription || null
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
