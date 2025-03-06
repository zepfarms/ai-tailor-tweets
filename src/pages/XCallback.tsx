
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const XCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) {
          throw new Error('No authorization code received');
        }
        
        if (!state) {
          throw new Error('No state parameter received');
        }
        
        // Retrieve the code verifier and user ID from localStorage
        const codeVerifier = localStorage.getItem('x_code_verifier');
        const userId = localStorage.getItem('x_user_id');
        const savedState = localStorage.getItem('x_state');
        
        if (!codeVerifier) {
          throw new Error('No code verifier found');
        }
        
        if (!userId) {
          throw new Error('No user ID found');
        }
        
        if (state !== savedState) {
          throw new Error('State mismatch - possible CSRF attack');
        }
        
        // Exchange the code for access token
        const response = await fetch(
          `${window.location.origin}/.netlify/functions/twitter-access-token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              codeVerifier,
              state,
              userId,
            }),
          }
        );
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.success && data.username) {
          // Clear localStorage items
          localStorage.removeItem('x_code_verifier');
          localStorage.removeItem('x_state');
          localStorage.removeItem('x_user_id');
          
          // Redirect to dashboard with success parameter
          navigate(`/dashboard?x_auth_success=true&username=${data.username}`);
        } else {
          throw new Error('Failed to link X account');
        }
      } catch (err) {
        console.error('Error in X callback:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        
        // Clear localStorage items
        localStorage.removeItem('x_code_verifier');
        localStorage.removeItem('x_state');
        localStorage.removeItem('x_user_id');
        
        toast({
          title: 'Failed to link X account',
          description: err instanceof Error ? err.message : 'Please try again later',
          variant: 'destructive',
        });
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };
    
    handleCallback();
  }, [navigate, toast]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {error ? (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Error Linking X Account</h1>
          <p className="text-muted-foreground">{error}</p>
          <p>Redirecting you back to dashboard...</p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Linking Your X Account</h1>
          <p className="text-muted-foreground">Please wait while we complete the connection...</p>
        </div>
      )}
    </div>
  );
};

export default XCallback;
