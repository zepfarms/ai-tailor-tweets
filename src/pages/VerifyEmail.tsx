
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Parse the URL for parameters
        const params = new URLSearchParams(location.hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (type !== 'recovery' && type !== 'signup') {
          throw new Error('Invalid verification type');
        }

        if (!accessToken) {
          throw new Error('No access token provided');
        }

        // Set the session using the tokens
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (sessionError) {
          throw sessionError;
        }

        // Verification successful
        setSuccess(true);
        
        toast({
          title: 'Email Verified',
          description: 'Your email has been successfully verified!',
        });

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (err) {
        console.error('Verification error:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify email');
        
        toast({
          title: 'Verification Failed',
          description: err instanceof Error ? err.message : 'Failed to verify email',
          variant: 'destructive',
        });
      } finally {
        setVerifying(false);
      }
    };

    handleEmailVerification();
  }, [location, navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 mt-16">
        <div className="w-full max-w-md">
          <Card className="glass-card animate-scale-in">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Email Verification
              </CardTitle>
              <CardDescription className="text-center">
                {verifying 
                  ? 'Verifying your email...' 
                  : success 
                    ? 'Your email has been verified!' 
                    : 'Verification failed'}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center py-8">
              {verifying ? (
                <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
              ) : success ? (
                <div className="text-center">
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-6">
                    Your email has been successfully verified. You will be redirected to the dashboard shortly.
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                  <p className="text-destructive mb-2">
                    {error || 'Verification failed. Please try again.'}
                  </p>
                  <p className="text-muted-foreground mb-6">
                    There was a problem verifying your email. Please try again or contact support if the problem persists.
                  </p>
                  <Button onClick={() => navigate('/login')}>
                    Go to Login
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyEmail;
