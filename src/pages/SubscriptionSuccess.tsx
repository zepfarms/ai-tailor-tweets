
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CheckCircle, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SubscriptionSuccess: React.FC = () => {
  const { user, updateSubscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  // Check for query parameters from Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    
    if (sessionId) {
      // Store session ID in session storage for verification
      sessionStorage.setItem('stripe_session_id', sessionId);
    }
  }, [location]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const updateStatus = async () => {
      try {
        setIsLoading(true);
        const hasActiveSubscription = await updateSubscriptionStatus();
        
        if (hasActiveSubscription) {
          setSubscriptionStatus('active');
          toast({
            title: "Subscription Activated",
            description: "Thank you for subscribing to Posted Pal Pro!",
          });
          setIsLoading(false);
        } else {
          // If subscription is not active yet, retry a few times
          if (retryCount < 8) {
            console.log(`Subscription not active yet, retrying... (${retryCount + 1}/8)`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000); // Wait 2 seconds before retrying
          } else {
            // After several retries, just show the success message anyway
            // The subscription might still be processing on Stripe's end
            setSubscriptionStatus('processing');
            toast({
              title: "Subscription Processing",
              description: "Your payment was successful! Your subscription is being processed and should be active soon.",
            });
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error updating subscription status:', error);
        setSubscriptionStatus('error');
        toast({
          title: "Error",
          description: "There was an issue checking your subscription status. Please contact support if this persists.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    updateStatus();
  }, [user, navigate, updateSubscriptionStatus, toast, retryCount]);

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />

      <main className="flex-1 container px-4 py-8 pt-24 max-w-6xl mx-auto">
        <Breadcrumb
          segments={[
            { name: "Subscription", href: "/subscription" },
            { name: "Success", href: "/subscription-success" },
          ]}
          className="mb-6"
        />

        <div className="flex flex-col items-center justify-center py-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto bg-green-50 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                {isLoading ? (
                  <Loader className="h-8 w-8 text-green-600 animate-spin" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold">
                {isLoading ? "Processing Your Subscription" : "Subscription Successful!"}
              </CardTitle>
              <CardDescription>
                {isLoading 
                  ? "Please wait while we verify your payment..." 
                  : subscriptionStatus === 'active'
                    ? "Your Posted Pal Pro subscription is now active"
                    : "Your payment was successful! Your account will be upgraded shortly."}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {isLoading ? (
                <p className="mb-6">
                  This may take a few moments. Please don't close this page.
                </p>
              ) : (
                <div>
                  <p className="mb-6">
                    {subscriptionStatus === 'error' 
                      ? "We encountered an issue while activating your subscription. Please contact our support team for assistance."
                      : subscriptionStatus === 'processing'
                        ? "Your payment was successful! Your account is being upgraded and all features will be available shortly."
                        : "Thank you for subscribing to Posted Pal Pro! You now have full access to all premium features."}
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SubscriptionSuccess;
