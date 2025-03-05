
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeXOAuthFlow } from '@/lib/xOAuthUtils';
import { useToast } from "@/components/ui/use-toast";

const XCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your X authorization...');
  const [details, setDetails] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        console.log('X callback page loaded');
        
        // Get the OAuth code and state from the URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
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
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setMessage('Authentication failed');
        setDetails(errorMessage);
        
        toast({
          title: "Error Linking X Account",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Redirect to dashboard after delay
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/dashboard');
          }
        }, 3000);
      }
    };
    
    processOAuthCallback();
  }, [navigate, toast]);

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
          
          {(status === 'success' || status === 'error') && !window.opener && (
            <div className="mt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-blue-500 hover:underline"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XCallback;
