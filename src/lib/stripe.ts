
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
    console.log(`Checking subscription status for user ${userId}, sessionId: ${sessionId || 'none'}`);
    const { data, error } = await supabase.functions.invoke('check-subscription', {
      body: { userId, sessionId }
    });

    if (error) {
      console.error('Error from check-subscription function:', error);
      throw error;
    }
    
    console.log('Subscription check result:', data);
    return data;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw error;
  }
}

// Add a new function to directly query the database for subscription
export async function getSubscriptionFromDatabase(userId: string) {
  try {
    console.log(`Directly checking database subscription for user ${userId}`);
    
    // Use a direct RPC call instead of table access to avoid type issues
    const { data, error } = await supabase.rpc('get_user_subscription', { 
      user_id_param: userId 
    });
    
    if (error) {
      console.error('Error in RPC call:', error);
      return { hasActiveSubscription: false, subscription: null };
    }
    
    console.log('Database subscription result:', data);
    
    // Check if data exists and has a status property before accessing it
    const hasActiveSubscription = data && typeof data === 'object' && 'status' in data && data.status === 'active';
    
    return { 
      hasActiveSubscription, 
      subscription: data 
    };
  } catch (error) {
    console.error('Error checking database subscription:', error);
    return { hasActiveSubscription: false, subscription: null };
  }
}

export const SUBSCRIPTION_PRICE_ID = 'price_1R03pDGKh91akIxXo1XPV5s0';
