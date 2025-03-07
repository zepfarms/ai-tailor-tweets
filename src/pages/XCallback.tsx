
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { processTwitterCallback } from '@/lib/xOAuthUtils';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import XAuthRedirectHandler from '@/components/XAuthRedirectHandler';

const XCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      setIsProcessing(true);
      
      try {
        // Parse the query parameters
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const oauthError = params.get('error');
        
        // Check if there was an error returned from Twitter
        if (oauthError) {
          console.error('OAuth error returned from Twitter:', oauthError);
          setError(`Twitter returned an error: ${oauthError}`);
          return;
        }
        
        // Make sure we have the necessary parameters
        if (!code || !state) {
          console.error('Missing code or state parameter', { code, state });
          setError('Missing authentication parameters');
          return;
        }
        
        console.log('Processing X callback with code and state');
        const result = await processTwitterCallback(code, state);
        
        if (result.success) {
          // Refresh the user data to reflect the new X connection
          await refreshUser();
          
          toast({
            title: "X Account Connected",
            description: `Successfully connected to X as @${result.username}`,
          });
          
          // Return to the dashboard or original page
          navigate(result.returnUrl);
        } else {
          setError('Failed to complete X authentication');
        }
      } catch (error) {
        console.error('Error in X callback processing:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleCallback();
  }, [location, navigate, toast, refreshUser]);
  
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Connecting X Account</h1>
          <p className="text-muted-foreground">Please wait while we complete the connection...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="flex justify-center">
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If we get here, the XAuthRedirectHandler will take over
  return <XAuthRedirectHandler />;
};

export default XCallback;
