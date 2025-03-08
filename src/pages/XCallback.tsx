
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Check, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const XCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { completeXAuth } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  const [processingStep, setProcessingStep] = useState('Initializing');
  const [processedCode, setProcessedCode] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setIsProcessing(true);
        setNetworkLogs([]);
        addLog("X Callback process started");

        // Get query parameters from searchParams
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        setProcessingStep('Validating parameters');
        addLog(`Received parameters: code=${!!code}, state=${!!state}, error=${error || 'none'}`);

        // Check if we've already processed this code to prevent duplicates
        if (processedCode === code) {
          addLog(`Already processed code ${code?.substring(0, 8)}..., skipping`);
          return;
        }

        // Check if there's an error from Twitter
        if (error) {
          console.error("X auth error:", error, errorDescription);
          setError(`X authentication error: ${error} - ${errorDescription || 'Unknown error'}`);
          addLog(`Error from X: ${error} - ${errorDescription || 'Unknown error'}`);
          toast({
            title: 'X Authentication Failed',
            description: errorDescription || 'Failed to connect X account',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent(`X authentication failed: ${errorDescription || 'Unknown error'}`)), 8000);
          return;
        }

        // Validate code and state
        if (!code || !state) {
          console.error("Missing code or state params", { code, state });
          setError('Missing required parameters for X authentication');
          addLog(`Missing parameters: code=${!!code}, state=${!!state}`);
          toast({
            title: 'X Authentication Failed',
            description: 'Missing required parameters from X',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent('Missing authentication parameters')), 8000);
          return;
        }

        // Verify state matches the one we sent
        const savedState = localStorage.getItem('x_auth_state');
        addLog(`Stored state from localStorage: ${savedState || 'none'}`);
        if (savedState && savedState !== state) {
          console.error("State mismatch", { 
            received: state,
            saved: savedState 
          });
          setError('Security verification failed: state parameter mismatch');
          addLog(`State mismatch: received=${state}, saved=${savedState}`);
          toast({
            title: 'X Authentication Failed',
            description: 'Security verification failed - possible cross-site request forgery attempt',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent('Security verification failed')), 8000);
          return;
        }

        console.log("Processing X callback with code and state", { 
          codeLength: code.length, 
          state,
          url: window.location.href 
        });
        addLog(`Processing code (length: ${code.length}) and state: ${state.substring(0, 8)}...`);
        
        // Mark this code as processed to prevent duplicate requests
        setProcessedCode(code);
        
        // Get debug info to help with troubleshooting
        setProcessingStep('Collecting debug information');
        try {
          console.log("Fetching debug info for X connection");
          addLog("Requesting debug information from server");
          const { data, error } = await supabase.functions.invoke('debug-x-connection');
          if (error) {
            console.error("Error getting debug info:", error);
            addLog(`Error getting debug info: ${error.message || 'Unknown error'}`);
          } else if (data) {
            setDebugInfo(data);
            console.log("Debug info:", data);
            addLog(`Debug info received: ${Object.keys(data).join(', ')}`);
          }
        } catch (debugError) {
          console.error("Error getting debug info:", debugError);
          addLog(`Error getting debug info: ${debugError instanceof Error ? debugError.message : 'Unknown error'}`);
          // Continue anyway as this isn't critical
        }
        
        // Get the origin for the current site to ensure it matches what was used during auth
        const origin = window.location.origin;
        addLog(`Current origin: ${origin}`);
        
        // Process the token
        setProcessingStep('Exchanging authorization code');
        console.log("Calling twitter-access-token function with code and state");
        addLog("Sending code to server for token exchange");
        
        const response = await supabase.functions.invoke('twitter-access-token', {
          body: { 
            code, 
            state,
            origin // Send the current origin for validation
          }
        });

        console.log("Access token response:", response);
        
        if (response.error) {
          console.error("Error processing token:", response.error);
          addLog(`Token exchange error: ${response.error.message || 'Unknown error'}`);
          setError(`Error processing token: ${response.error.message}`);
          toast({
            title: 'X Authentication Failed',
            description: response.error.message || 'Failed to verify X account',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent(response.error.message || 'Failed to verify X account')), 8000);
          return;
        }
        
        // Success case
        addLog(`Token exchange response: success`);
        setProcessingStep('Processing authentication');
        
        if (response.data && response.data.token) {
          // We have a magic link token to complete the auth
          try {
            addLog("Completing X authentication with token");
            await completeXAuth(response.data.token);
            toast({
              title: 'X Account Connected',
              description: `Successfully linked to @${response.data.username}`,
            });
            setUsername(response.data.username);
            addLog(`Authentication completed, redirecting to dashboard`);
            // Delay redirect to show success screen
            setTimeout(() => {
              navigate('/dashboard?x_auth_success=true&username=' + response.data.username);
            }, 3000);
          } catch (authError) {
            console.error("Error completing X auth:", authError);
            addLog(`Error completing auth: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
            setError(`Failed to complete authentication: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
            toast({
              title: 'X Authentication Failed',
              description: authError instanceof Error ? authError.message : 'Failed to complete authentication',
              variant: 'destructive',
            });
            setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent('Failed to complete authentication')), 8000);
          }
        } else if (response.data && response.data.username) {
          addLog(`Account linked: @${response.data.username}`);
          setUsername(response.data.username);
          toast({
            title: 'X Account Connected',
            description: `Successfully linked to @${response.data.username}`,
          });
          
          // Delay redirect to show success screen
          setTimeout(() => {
            navigate('/dashboard?x_auth_success=true&username=' + response.data.username);
          }, 3000);
        } else {
          console.error("Invalid response from auth service:", response.data);
          addLog(`Invalid response from server: ${JSON.stringify(response.data || {})}`);
          setError('Invalid response from authentication service');
          toast({
            title: 'X Authentication Failed',
            description: 'Invalid response from authentication service',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent('Invalid response from authentication service')), 8000);
        }
      } catch (err) {
        console.error('Error in X callback:', err);
        addLog(`Unhandled error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast({
          title: 'X Authentication Failed',
          description: err instanceof Error ? err.message : 'An unexpected error occurred',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/dashboard?error=' + encodeURIComponent(err instanceof Error ? err.message : 'An unexpected error occurred')), 8000);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [navigate, toast, completeXAuth, searchParams]);

  const addLog = (message: string) => {
    setNetworkLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const retryAuthentication = () => {
    setIsProcessing(true);
    setError(null);
    setDebugInfo(null);
    setNetworkLogs([]);
    setProcessedCode(null);
    setUsername(null);
    setAttempts(prev => prev + 1);
    addLog("Retrying authentication process");
  };

  const returnToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {isProcessing ? (
        <Card className="p-6 max-w-md w-full">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-2">Connecting Your X Account</h1>
            <p className="text-muted-foreground text-center mb-4">
              Please wait while we complete the connection with X...
            </p>
            <div className="w-full bg-muted rounded-md p-2 mb-4">
              <p className="text-xs font-medium mb-1">Current step: {processingStep}</p>
              <div className="w-full bg-secondary-foreground/10 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse rounded-full"></div>
              </div>
            </div>
            {networkLogs.length > 0 && (
              <div className="w-full mt-4 text-xs text-muted-foreground bg-muted p-3 rounded max-h-32 overflow-y-auto">
                {networkLogs.map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                ))}
              </div>
            )}
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6 max-w-md w-full">
          <div className="flex flex-col items-center">
            <div className="text-destructive mb-4">
              <AlertTriangle size={64} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <div className="flex flex-col gap-4 mb-4 w-full">
              <Button onClick={retryAuthentication} className="mb-2 w-full" size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Authentication
              </Button>
              <Button variant="outline" onClick={returnToDashboard} className="w-full" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Button>
            </div>
            
            {/* Show connection logs */}
            {networkLogs.length > 0 && (
              <div className="w-full mt-4">
                <h2 className="text-lg font-semibold mb-2">Connection Logs</h2>
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded mb-4 max-h-32 overflow-y-auto">
                  {networkLogs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Show debug info if available */}
            {debugInfo && (
              <div className="w-full mt-2">
                <h2 className="text-lg font-semibold mb-2">Technical Details</h2>
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded mb-4 max-h-60 overflow-auto">
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6 max-w-md w-full">
          <div className="flex flex-col items-center">
            <div className="text-green-500 mb-4">
              <Check size={64} />
            </div>
            <h1 className="text-2xl font-bold mb-2">X Account Connected</h1>
            {username && (
              <p className="text-lg font-medium text-primary mb-2">@{username}</p>
            )}
            <p className="text-muted-foreground text-center mb-6">
              Your X account has been successfully connected.
            </p>
            <p className="text-center mb-4">Redirecting you to dashboard...</p>
            <Button onClick={returnToDashboard} className="w-full" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard Now
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default XCallback;
