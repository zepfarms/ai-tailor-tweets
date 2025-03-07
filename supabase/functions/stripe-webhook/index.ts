
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response("No signature provided", { status: 400 });
  }

  try {
    const body = await req.text();
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    console.log(`Event received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (userId && customerId && subscriptionId) {
          // Store subscription data in Supabase
          const { error } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: 'active',
              price_id: session.line_items?.data[0]?.price?.id || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (error) {
            console.error("Error saving subscription:", error);
            throw error;
          }
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const status = subscription.status;
        const subscriptionId = subscription.id;

        // Update subscription status in Supabase
        const { error } = await supabase
          .from("subscriptions")
          .update({ 
            status,
            updated_at: new Date().toISOString() 
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Error updating subscription:", error);
          throw error;
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        // Update subscription status in Supabase
        const { error } = await supabase
          .from("subscriptions")
          .update({ 
            status: 'canceled',
            updated_at: new Date().toISOString(),
            canceled_at: new Date().toISOString()
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Error canceling subscription:", error);
          throw error;
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
});
