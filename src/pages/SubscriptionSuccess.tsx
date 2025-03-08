import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CheckCircle, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { checkSubscriptionStatus, getSubscriptionFromDatabase } from '@/lib/stripe';

const SubscriptionSuccess: React.FC = () => {
  const { user, updateSubscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<string | null>(null);

  // Get session ID from query parameters
  const params = new URLSearchParams(location.search);
  const sessionId = params.get('session_id');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const verifyPayment = async () => {
      try {
        setIsLoading(true);
        console.log('Starting payment verification process...');
        
        // First, try direct database lookup for faster response
        const dbResult = await getSubscriptionFromDatabase(user.id);
        
        if (dbResult.hasActiveSubscription) {
          console.log('Found active subscription in database:', dbResult.subscription);
          setSubscriptionStatus('active');
          setVerificationMethod('database');
          toast({
            title: "Subscription Activated",
            description: "Thank you for subscribing to Posted Pal Pro!",
          });
          
          await updateSubscriptionStatus();
          setIsLoading(false);
          return;
        }
        
        // If no active subscription in database, try using the session ID
        if (sessionId) {
          console.log(`Verifying payment with session ID: ${sessionId}`);
          try {
            const result = await checkSubscriptionStatus(user.id);
            
            if (result?.hasActiveSubscription) {
              console.log('Session verification confirmed subscription:', result);
              setSubscriptionStatus('active');
              setVerificationMethod('stripe_session');
              toast({
                title: "Subscription Activated",
                description: "Thank you for subscribing to Posted Pal Pro!",
              });
              
              await updateSubscriptionStatus();
              setIsLoading(false);
              return;
            }
          } catch (sessionError) {
            console.error('Error during session verification:', sessionError);
            // Continue with other methods if session verification fails
          }
        }
        
        // If still not found, use the standard subscription check
        try {
          console.log('Attempting standard subscription check');
          const hasActiveSubscription = await updateSubscriptionStatus();
          
          if (hasActiveSubscription) {
            console.log('Standard check found active subscription');
            setSubscriptionStatus('active');
            setVerificationMethod('auth_context');
            toast({
              title: "Subscription Activated",
              description: "Thank you for subscribing to Posted Pal Pro!",
            });
            setIsLoading(false);
            return;
          }
        } catch (updateError) {
          console.error('Error during standard subscription check:', updateError);
        }
        
        // If subscription is still not active, retry a few times
        if (retryCount < 4) {
          console.log(`Subscription not found yet, retrying... (${retryCount + 1}/4)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000); // Wait 3 seconds before retrying
        } else {
          // After retries, show processing message
          console.log('Max retries reached, showing processing message');
          setSubscriptionStatus('processing');
          toast({
            title: "Subscription Processing",
            description: "Your payment was successful! Your subscription is being processed and should be active soon.",
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setSubscriptionStatus('error');
        toast({
          title: "Error",
          description: "There was an issue checking your subscription status. Please contact support if this persists.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [user, navigate, updateSubscriptionStatus, toast, retryCount, sessionId]);

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
