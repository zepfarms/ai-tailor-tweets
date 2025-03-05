
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { clearOAuthParams, validateOAuthState, extractOAuthCode } from '@/lib/xOAuthUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const XCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the code and state from the URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code || !state) {
          throw new Error('Missing required OAuth parameters');
        }
        
        // Validate the OAuth state
        const isStateValid = validateOAuthState(state);
        if (!isStateValid) {
          throw new Error('Invalid OAuth state. This may be a security issue or your session expired.');
        }
        
        // Extract the OAuth code
        const oauthCode = extractOAuthCode(code);
        if (!oauthCode) {
          throw new Error('Failed to extract OAuth code');
        }
        
        // Log success
        console.log('X authentication successful:', { code, state });
        
        // Post message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'X_AUTH_SUCCESS',
            username: 'user', // This will be updated with the actual username later
            code: oauthCode,
            state: state
          }, window.location.origin);
          
          console.log('Posted authentication success message to parent window');
          
          // Set success status
          setStatus('success');
          
          // Close window after a short delay if it's a popup
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          // If not in a popup (direct navigation), redirect back to dashboard
          console.log('Not in a popup window, redirecting to dashboard');
          setStatus('success');
          
          // Use localStorage to temporarily flag successful auth for the main window
          localStorage.setItem('x_auth_success', 'true');
          localStorage.setItem('x_auth_timestamp', Date.now().toString());
          
          // Redirect back to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('X authentication error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        
        // Show error toast
        toast({
          title: "Authentication Failed",
          description: error instanceof Error ? error.message : "Something went wrong during authentication",
          variant: "destructive",
        });
        
        // Important: Don't clear OAuth parameters on error, to allow retry
        // This approach maintains the user's session
      }
    };
    
    processCallback();
  }, [searchParams, navigate, toast]);

  const handleGoHome = () => {
    // Ensure we preserve the logged-in state by not clearing OAuth params here
    navigate('/dashboard');
  };

  const handleRetry = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">X Authorization</CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-center text-xl">Processing authentication...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center text-xl">Authentication successful!</p>
              <p className="text-center text-muted-foreground">
                Your X account has been successfully linked.
              </p>
              {!window.opener && (
                <p className="text-center text-muted-foreground">
                  Redirecting you back to the dashboard...
                </p>
              )}
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-center text-xl">Authentication failed</p>
              <p className="text-center text-muted-foreground">
                {errorMessage || 'Authentication session expired. Please try again.'}
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          {status === 'error' && (
            <Button variant="outline" onClick={handleRetry} className="mr-2">
              Try Again
            </Button>
          )}
          
          {(status === 'success' || status === 'error') && !window.opener && (
            <Button onClick={handleGoHome}>
              Return to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default XCallback;
