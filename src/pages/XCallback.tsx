
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeXOAuthFlow } from '@/lib/xOAuthUtils';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';

const XCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your X authorization...');
  const [details, setDetails] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const processOAuthCallback = async () => {
    try {
      setStatus('processing');
      setMessage('Processing your X authorization...');
      setDetails(null);
      setIsRetrying(true);
      
      console.log('X callback page loaded');
      
      // Get the OAuth code and state from the URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      console.log('OAuth 2.0 params from URL:', { code, state, error, errorDescription });
      
      if (error) {
        setStatus('error');
        setMessage(`Authorization error: ${error}`);
        setDetails(errorDescription || 'The X authorization was denied or failed.');
        return;
      }
      
      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization parameters');
        setDetails('The authorization did not provide the necessary parameters. Please try again.');
        return;
      }
      
      // Complete the OAuth flow
      setMessage('Connecting to X...');
      const result = await completeXOAuthFlow(code, state);
      
      if (result.success) {
        setStatus('success');
        setMessage(`Successfully linked X account: @${result.username}`);
        
        // Update the user in local storage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.xLinked = true;
          user.xUsername = `@${result.username}`;
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          // Try to get from the auth_redirect_user
          const redirectUser = localStorage.getItem('auth_redirect_user');
          if (redirectUser) {
            const user = JSON.parse(redirectUser);
            user.xLinked = true;
            user.xUsername = `@${result.username}`;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
        
        // If this is a popup window, close it
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'X_AUTH_SUCCESS', 
            username: result.username,
            profileImageUrl: result.profileImageUrl 
          }, window.location.origin);
          
          // Close after a short delay
          setTimeout(() => window.close(), 2000);
        } else {
          // Otherwise, redirect to dashboard
          setTimeout(() => navigate('/dashboard'), 2000);
        }
        
        toast({
          title: "X Account Linked",
          description: `You've successfully linked your X account: @${result.username}`,
        });
      } else {
        throw new Error('Failed to link X account');
      }
    } catch (error) {
      console.error('Error in X callback:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setStatus('error');
      setMessage('Authentication failed');
      setDetails(errorMessage);
      
      toast({
        title: "Error Linking X Account",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    processOAuthCallback();
  }, [navigate, toast, searchParams]);

  const restartAuth = () => {
    // Remove any existing OAuth params to ensure a clean slate
    localStorage.removeItem('x_oauth_state');
    localStorage.removeItem('x_oauth_code_verifier');
    localStorage.removeItem('x_oauth_timestamp');
    localStorage.removeItem('x_oauth_backup');
    document.cookie = 'x_oauth_data=; max-age=0; path=/';
    
    // Navigate back to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 rounded-lg shadow-lg bg-card">
        <div className="text-center">
          {status === 'processing' && (
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          )}
          
          {status === 'success' && (
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          )}
          
          <h2 className="text-xl font-bold mb-2">X Authorization</h2>
          <p className="text-muted-foreground">{message}</p>
          
          {details && (
            <p className="mt-2 text-sm text-muted-foreground">{details}</p>
          )}
          
          {status === 'error' && (
            <div className="mt-6 space-y-2">
              <Button 
                onClick={restartAuth}
                className="w-full"
                variant="default"
              >
                Return to Dashboard & Try Again
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                If you're seeing a session expired message, please try authorizing again from the dashboard.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This error can happen if your browser cleared the session data or if too much time passed since starting the authorization.
              </p>
            </div>
          )}
          
          {status === 'success' && !window.opener && (
            <div className="mt-6">
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XCallback;
