
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeXOAuthFlow, getStoredRedirectPage, clearOAuthParams } from '@/lib/xOAuthUtils';
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const XCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your X authorization...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('X callback page loaded, checking URL parameters');
        
        // Get code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        console.log('Callback parameters:', { 
          code: code ? (code.substring(0, 10) + '...') : 'null', 
          error, 
          errorDescription 
        });
        
        if (error) {
          console.error(`X authorization error: ${error}, description: ${errorDescription}`);
          setStatus('error');
          setMessage(`X authorization failed: ${error}`);
          setErrorDetails(errorDescription || "No error description provided");
          
          toast({
            title: "Error Linking X Account",
            description: errorDescription || error || "Authorization failed",
            variant: "destructive",
          });
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          
          return;
        }
        
        if (!code) {
          console.error('Missing authorization code in callback');
          setStatus('error');
          setMessage('Missing authorization code');
          setErrorDetails('The authorization did not provide the necessary code');
          
          toast({
            title: "Error Linking X Account",
            description: "Missing authorization code",
            variant: "destructive",
          });
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          
          return;
        }
        
        // Complete the OAuth flow
        console.log('Calling completeXOAuthFlow with code');
        const result = await completeXOAuthFlow(code);
        
        console.log('OAuth flow result:', result);
        
        if (result.success) {
          setStatus('success');
          setMessage(`Successfully linked X account: @${result.username}`);
          
          toast({
            title: "X Account Linked",
            description: `Successfully linked to @${result.username}`,
          });
          
          // Redirect back to dashboard with success parameters
          setTimeout(() => {
            console.log('Redirecting to dashboard with success parameters');
            navigate('/dashboard?x_auth_success=true&username=' + result.username);
          }, 1500);
        }
      } catch (error) {
        console.error('Error in X callback:', error);
        setStatus('error');
        setMessage('Authentication failed');
        setErrorDetails(error instanceof Error ? error.message : 'An unknown error occurred');
        
        toast({
          title: "Error Linking X Account",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "destructive",
        });
        
        // Clear any lingering OAuth params
        clearOAuthParams();
        
        // Redirect back to dashboard after a delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };
    
    processCallback();
  }, [toast, navigate]);

  const handleClose = () => {
    navigate('/dashboard');
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
              <XCircle className="w-6 h-6" />
            </div>
          )}
          
          <h2 className="text-xl font-bold mb-2">X Authorization</h2>
          <p className="text-muted-foreground mb-4">{message}</p>
          
          {errorDetails && (
            <p className="mt-2 text-sm text-muted-foreground bg-red-50 p-3 rounded">
              Error details: {errorDetails}
            </p>
          )}
          
          {status === 'error' && (
            <div className="mt-4">
              <button 
                onClick={handleClose}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
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
