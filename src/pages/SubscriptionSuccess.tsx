
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SubscriptionSuccess: React.FC = () => {
  const { user, updateSubscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const updateStatus = async () => {
      try {
        await updateSubscriptionStatus?.();
        toast({
          title: "Subscription Activated",
          description: "Thank you for subscribing to Posted Pal Pro!",
        });
      } catch (error) {
        console.error('Error updating subscription status:', error);
      }
    };

    updateStatus();
  }, [user, navigate, updateSubscriptionStatus, toast]);

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
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Subscription Successful!</CardTitle>
              <CardDescription>
                Your Posted Pal Pro subscription is now active
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6">
                Thank you for subscribing to Posted Pal Pro! You now have full access to all premium features.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SubscriptionSuccess;
