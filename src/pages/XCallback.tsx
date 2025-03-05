
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { validateOAuthState, extractOAuthCode, exchangeCodeForToken, clearOAuthParams } from '@/lib/xOAuthUtils';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const XCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const url = window.location.href;
        const urlObj = new URL(url);
        
        // Extract parameters
        const receivedState = urlObj.searchParams.get('state');
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');
        const errorDescription = urlObj.searchParams.get('error_description');
        
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setStatus('error');
          setErrorMessage(errorDescription || 'Authentication failed');
          clearOAuthParams();
          return;
        }
        
        if (!receivedState || !code) {
          console.error('Missing OAuth parameters');
          setStatus('error');
          setErrorMessage('Missing authentication parameters');
          clearOAuthParams();
          return;
        }
        
        // Validate state parameter
        if (!validateOAuthState(receivedState)) {
          console.error('Invalid OAuth state');
          setStatus('error');
          setErrorMessage('Invalid authentication state');
          clearOAuthParams();
          return;
        }
        
        const codeVerifier = localStorage.getItem('x_oauth_code_verifier');
        
        if (!codeVerifier) {
          console.error('Missing code verifier');
          setStatus('error');
          setErrorMessage('Authentication session expired');
          clearOAuthParams();
          return;
        }
        
        // Get stored user from localStorage for X account linking
        const redirectUser = localStorage.getItem('auth_redirect_user');
        const userId = user?.id || (redirectUser ? JSON.parse(redirectUser).id : null);
        
        if (!userId) {
          console.error('No user ID available');
          setStatus('error');
          setErrorMessage('User not authenticated');
          clearOAuthParams();
          return;
        }

        // Exchange code for token
        const result = await exchangeCodeForToken(code, codeVerifier, userId);
        
        if (!result.success) {
          console.error('Token exchange failed:', result.error);
          setStatus('error');
          setErrorMessage(result.error || 'Failed to authenticate with X');
          clearOAuthParams();
          return;
        }

        // Send success message to parent window if we're in a popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'X_AUTH_SUCCESS',
            username: result.username
          }, window.location.origin);

          // Close the popup after a brief delay
          setTimeout(() => window.close(), 2000);
        } else {
          // If not in a popup, mark success and handle accordingly
          localStorage.setItem('x_auth_success', 'true');
          localStorage.setItem('x_auth_timestamp', Date.now().toString());

          // Ensure the current session state is preserved
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData.session) {
            // If session is lost, attempt to restore it
            console.log('Session lost during X auth, attempting to restore');
            if (redirectUser) {
              const parsedUser = JSON.parse(redirectUser);
              toast({
                title: "Session expired",
                description: "Please log in again to complete X account linking",
                variant: "destructive",
              });
              navigate('/login');
              return;
            }
          }
        }
        
        setStatus('success');
        clearOAuthParams();
        
      } catch (error) {
        console.error('Error processing X callback:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        clearOAuthParams();
      }
    };
    
    processCallback();
  }, []);

  const handleReturnHome = () => {
    // Check if we should navigate or close the window
    if (window.opener) {
      window.close();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === 'loading' && 'Completing X Authorization...'}
            {status === 'success' && 'X Authorization Successful'}
            {status === 'error' && 'X Authorization Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we complete the authorization process.'}
            {status === 'success' && 'Your X account has been successfully linked.'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {status === 'loading' && (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center">
          {(status === 'success' || status === 'error') && (
            <Button onClick={handleReturnHome}>
              {window.opener ? 'Close Window' : 'Return to Dashboard'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default XCallback;
