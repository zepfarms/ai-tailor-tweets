
import { supabase } from '@/integrations/supabase/client';

interface CreateSessionParams {
  priceId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  priceId,
  userId,
  customerEmail,
  successUrl,
  cancelUrl
}: CreateSessionParams) {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        userId,
        customerEmail,
        successUrl,
        cancelUrl
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function checkSubscriptionStatus(userId: string, sessionId?: string) {
  try {
    const { data, error } = await supabase.functions.invoke('check-subscription', {
      body: { userId, sessionId }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw error;
  }
}

export const SUBSCRIPTION_PRICE_ID = 'price_1R03pDGKh91akIxXo1XPV5s0';
