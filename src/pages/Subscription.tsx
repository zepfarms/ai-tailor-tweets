
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Check, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createCheckoutSession, SUBSCRIPTION_PRICE_ID, CreateCheckoutSessionParams } from '@/lib/stripe';

const Subscription: React.FC = () => {
  const { user, hasSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = window.location.origin;
      const params: CreateCheckoutSessionParams = {
        priceId: SUBSCRIPTION_PRICE_ID,
        userId: user.id,
        customerEmail: user.email,
        successUrl: `${baseUrl}/subscription-success`,
        cancelUrl: `${baseUrl}/subscription`,
      };
      
      const session = await createCheckoutSession(params);

      if (session?.url) {
        window.location.href = session.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Could not initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />

      <main className="flex-1 container px-4 py-8 pt-24 max-w-6xl mx-auto">
        <Breadcrumb
          segments={[
            { name: "Subscription", href: "/subscription" }
          ]}
          className="mb-6"
        />

        <div className="flex flex-col items-center justify-center py-8">
          <h1 className="text-4xl font-bold mb-8 text-center">Posted Pal Pro</h1>

          {hasSubscription ? (
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-green-600">Active Subscription</CardTitle>
                <CardDescription className="text-center">You have an active subscription</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-green-50 p-4 rounded-full mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-center mb-6">
                  Thank you for subscribing to Posted Pal Pro! You have full access to all premium features.
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Posted Pal Pro</CardTitle>
                <CardDescription>$29 per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Unlimited posts per month</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>AI-powered content generation</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Custom posting schedules</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Team collaboration features</span>
                  </li>
                </ul>

                {!user && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-6">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        Please sign in or create an account to subscribe to Posted Pal Pro.
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={user ? handleSubscribe : () => navigate('/signup')} 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading 
                    ? "Processing..." 
                    : user 
                      ? "Subscribe Now" 
                      : "Create Account & Subscribe"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Subscription;
