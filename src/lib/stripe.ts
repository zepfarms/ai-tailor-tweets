
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused' | null;

/**
 * Checks if a user has an active subscription
 * 
 * @param userId The ID of the user to check
 * @returns A promise that resolves to true if the user has an active subscription, false otherwise
 */
export const checkSubscription = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.error("User ID is required to check subscription");
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('check-subscription', {
      body: { userId }
    });

    if (error) {
      console.error("Error checking subscription:", error);
      return false;
    }

    return data?.hasActiveSubscription ?? false;
  } catch (err) {
    console.error("Failed to check subscription:", err);
    return false;
  }
};

/**
 * Creates a checkout session for a user
 * 
 * @param userId The ID of the user to create a checkout session for
 * @param priceId The ID of the price to create a checkout session for
 * @returns A promise that resolves to the URL of the checkout session
 */
export const createCheckoutSession = async (userId: string, priceId: string): Promise<string> => {
  if (!userId || !priceId) {
    throw new Error("User ID and Price ID are required to create a checkout session");
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { userId, priceId }
    });

    if (error) {
      console.error("Error creating checkout session:", error);
      throw new Error(error.message);
    }

    if (!data?.url) {
      throw new Error("No checkout URL returned");
    }

    return data.url as string;
  } catch (err) {
    console.error("Failed to create checkout session:", err);
    throw err;
  }
};
