
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { validateOAuthState, extractOAuthCode, exchangeCodeForToken, clearOAuthParams } from '@/lib/xOAuthUtils';
import { supabase } from '@/integrations/supabase/client';

const XCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [xUsername, setXUsername] = useState<string | undefined>();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const url = window.location.href;
        console.log('Processing X callback URL:', url);
        const urlObj = new URL(url);
        
        // Extract parameters
        const receivedState = urlObj.searchParams.get('state');
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');
        const errorDescription = urlObj.searchParams.get('error_description');
        
        console.log('X callback parameters:', {
          state: receivedState ? receivedState.substring(0, 10) + '...' : null,
          code: code ? code.substring(0, 10) + '...' : null,
          error,
          errorDescription
        });
        
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
        console.log('Retrieved code verifier length:', codeVerifier?.length);
        
        if (!codeVerifier) {
          console.error('Missing code verifier');
          setStatus('error');
          setErrorMessage('Authentication session expired');
          clearOAuthParams();
          return;
        }
        
        // Get user info for X account linking
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        
        if (!userId) {
          // Try to get from localStorage if session is lost
          const redirectUser = localStorage.getItem('auth_redirect_user');
          const parsedUserId = redirectUser ? JSON.parse(redirectUser).id : null;
          
          if (!parsedUserId) {
            console.error('No user ID available');
            setStatus('error');
            setErrorMessage('User not authenticated');
            clearOAuthParams();
            return;
          }
          
          console.log('Using user ID from localStorage:', parsedUserId);
          
          // Exchange code for token
          const result = await exchangeCodeForToken(code, codeVerifier, parsedUserId);
          
          if (!result.success) {
            console.error('Token exchange failed:', result.error);
            setStatus('error');
            setErrorMessage(result.error || 'Failed to authenticate with X');
            clearOAuthParams();
            return;
          }
          
          console.log('Token exchange successful with stored user ID');
          setXUsername(result.username);
        } else {
          console.log('Using user ID from active session:', userId);
          
          // Exchange code for token
          const result = await exchangeCodeForToken(code, codeVerifier, userId);
          
          if (!result.success) {
            console.error('Token exchange failed:', result.error);
            setStatus('error');
            setErrorMessage(result.error || 'Failed to authenticate with X');
            clearOAuthParams();
            return;
          }
          
          console.log('Token exchange successful with session user ID');
          setXUsername(result.username);
        }

        // Send success message to parent window if we're in a popup
        if (window.opener) {
          console.log('We are in a popup, posting message to parent');
          window.opener.postMessage({
            type: 'X_AUTH_SUCCESS',
            username: xUsername
          }, window.location.origin);

          // Close the popup after a brief delay
          setTimeout(() => window.close(), 2000);
        } else {
          // If not in a popup, mark success and handle accordingly
          console.log('Not in a popup, storing success in localStorage');
          localStorage.setItem('x_auth_success', 'true');
          localStorage.setItem('x_auth_timestamp', Date.now().toString());
          if (xUsername) {
            localStorage.setItem('x_auth_username', xUsername);
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
