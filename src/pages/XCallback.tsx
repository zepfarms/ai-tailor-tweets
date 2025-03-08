
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

const XCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeXAuth } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setIsProcessing(true);

        // Get query parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        // Check if there's an error from Twitter
        if (error) {
          console.error("X auth error:", error, errorDescription);
          setError(`X authentication error: ${error} - ${errorDescription || 'Unknown error'}`);
          toast({
            title: 'X Authentication Failed',
            description: errorDescription || 'Failed to connect X account',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent(`X authentication failed: ${errorDescription || 'Unknown error'}`)), 3000);
          return;
        }

        // Validate code and state
        if (!code || !state) {
          console.error("Missing code or state params", { code, state });
          setError('Missing required parameters');
          toast({
            title: 'X Authentication Failed',
            description: 'Missing required parameters from X',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent('Missing authentication parameters')), 3000);
          return;
        }

        console.log("Processing X callback with code and state", { codeLength: code.length, state });
        
        // Get debug info if there's an issue
        try {
          const debugResponse = await supabase.functions.invoke('debug-x-connection');
          if (debugResponse.data) {
            setDebugInfo(debugResponse.data);
            console.log("Debug info:", debugResponse.data);
          }
        } catch (debugError) {
          console.error("Error getting debug info:", debugError);
        }
        
        // Process the token
        const response = await supabase.functions.invoke('twitter-access-token', {
          body: { code, state }
        });

        console.log("Access token response:", response);

        if (response.error) {
          console.error("Error processing token:", response.error);
          setError(`Error processing token: ${response.error.message}`);
          toast({
            title: 'X Authentication Failed',
            description: response.error.message || 'Failed to verify X account',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent(response.error.message || 'Failed to verify X account')), 3000);
          return;
        }

        if (response.data && response.data.token) {
          // We have a magic link token to complete the auth
          try {
            await completeXAuth(response.data.token);
            toast({
              title: 'X Account Connected',
              description: `Successfully linked to @${response.data.username}`,
            });
            navigate('/dashboard?x_auth_success=true&username=' + response.data.username);
          } catch (authError) {
            console.error("Error completing X auth:", authError);
            setError(`Failed to complete authentication: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
            toast({
              title: 'X Authentication Failed',
              description: authError instanceof Error ? authError.message : 'Failed to complete authentication',
              variant: 'destructive',
            });
            setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent('Failed to complete authentication')), 3000);
          }
        } else if (response.data && response.data.username) {
          toast({
            title: 'X Account Connected',
            description: `Successfully linked to @${response.data.username}`,
          });
          
          // Add query params to indicate success to the dashboard
          navigate('/dashboard?x_auth_success=true&username=' + response.data.username);
        } else {
          console.error("Invalid response from auth service:", response.data);
          setError('Invalid response from authentication service');
          toast({
            title: 'X Authentication Failed',
            description: 'Invalid response from authentication service',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent('Invalid response from authentication service')), 3000);
        }
      } catch (err) {
        console.error('Error in X callback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast({
          title: 'X Authentication Failed',
          description: err instanceof Error ? err.message : 'An unexpected error occurred',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent(err instanceof Error ? err.message : 'An unexpected error occurred')), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [navigate, toast, completeXAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {isProcessing ? (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connecting Your X Account</h1>
          <p className="text-muted-foreground text-center">
            Please wait while we complete the connection with X...
          </p>
        </>
      ) : error ? (
        <>
          <div className="text-destructive mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          {debugInfo && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-4 max-w-md overflow-auto">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          <p className="text-center">Redirecting you back to dashboard...</p>
        </>
      ) : (
        <>
          <div className="text-green-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">X Account Connected</h1>
          <p className="text-muted-foreground text-center mb-4">
            Your X account has been successfully connected.
          </p>
          <p className="text-center">Redirecting you to dashboard...</p>
        </>
      )}
    </div>
  );
};

export default XCallback;
