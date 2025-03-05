import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { completeXOAuthFlow, clearOAuthParams } from '@/lib/xOAuthUtils';
import { useToast } from "@/components/ui/use-toast";
import { X, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

const XCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your X authorization...');
  const [details, setDetails] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        console.log('X callback page loaded');
        console.log('URL:', window.location.href);
        
        // Get the OAuth code and state from the URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        console.log('OAuth 2.0 params from URL:', { 
          code: code ? `${code.substring(0, 10)}...` : null,
          state, 
          error, 
          errorDescription 
        });
        
        if (error) {
          setStatus('error');
          setMessage(`Authorization error: ${error}`);
          setDetails(errorDescription || 'The X authorization was denied or failed.');
          setErrorCode(error);
          
          toast({
            title: "X Authorization Failed",
            description: errorDescription || "The authorization was denied or failed.",
            variant: "destructive",
          });
          return;
        }
        
        if (!code || !state) {
          setStatus('error');
          setMessage('Missing authorization parameters');
          setDetails('The authorization did not provide the necessary parameters. Please try again.');
          setErrorCode('missing_params');
          
          toast({
            title: "Missing Authorization Parameters",
            description: "The authorization did not provide the necessary parameters.",
            variant: "destructive",
          });
          return;
        }
        
        // Show more detailed status
        setMessage('Connecting to X and verifying authorization...');
        
        try {
          console.log('Attempting to complete OAuth flow with code and state');
          const result = await completeXOAuthFlow(code, state);
          
          if (result.success) {
            setStatus('success');
            setMessage(`Successfully linked X account: @${result.username}`);
            
            // If this is a popup window, communicate success to parent
            if (window.opener) {
              console.log('This is a popup window, sending message to parent');
              window.opener.postMessage({ 
                type: 'X_AUTH_SUCCESS', 
                username: result.username,
                profileImageUrl: result.profileImageUrl 
              }, '*'); // Using * instead of origin for more compatibility
              
              // Close after a short delay
              setTimeout(() => window.close(), 1500);
            } else {
              // Otherwise, redirect to dashboard
              console.log('This is not a popup, redirecting to dashboard');
              toast({
                title: "X Account Linked",
                description: `You've successfully linked your X account: @${result.username}`,
              });
              setTimeout(() => navigate('/dashboard'), 1500);
            }
          } else {
            throw new Error('Failed to link X account');
          }
        } catch (error) {
          console.error('Error in OAuth completion:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error in X callback:', error);
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setMessage('Authentication failed');
        setDetails(errorMessage);
        setErrorCode('auth_failed');
        
        toast({
          title: "Error Linking X Account",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Close or redirect after a delay
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
  }, [navigate, toast, location]);

  const handleTryAgain = () => {
    // Clear any existing state
    clearOAuthParams();
    
    // Redirect to dashboard to try again
    navigate('/dashboard');
  };

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 rounded-lg shadow-lg bg-card">
        <div className="text-center">
          {status === 'processing' && (
            <div className="w-12 h-12 mx-auto mb-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {errorCode === 'session_expired' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>
          )}
          
          <h2 className="text-xl font-bold mb-2">X Authorization</h2>
          <p className="text-muted-foreground">{message}</p>
          
          {details && (
            <p className="mt-2 text-sm text-muted-foreground break-words">{details}</p>
          )}
          
          {status === 'error' && (
            <div className="mt-4 flex flex-col gap-2 items-center">
              <button 
                onClick={handleClose}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
              >
                Close Window
              </button>
              
              <button
                onClick={handleTryAgain}
                className="px-4 py-2 text-sm text-blue-500 hover:underline"
              >
                Try Again
              </button>
              
              {errorCode === 'session_expired' && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  <p className="font-medium">Session Expired</p>
                  <p className="mt-1">The authorization session has expired or cannot be found. Please try again.</p>
                </div>
              )}
            </div>
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
