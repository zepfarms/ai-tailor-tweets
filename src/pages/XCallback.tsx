
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const XCallback: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeXAuth } = useAuth();
  
  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const callbackType = searchParams.get('type') || 'link';
        
        if (!code || !state) {
          throw new Error('Missing required OAuth parameters');
        }
        
        // Get the stored state from localStorage
        const storedState = localStorage.getItem('x_auth_state');
        localStorage.removeItem('x_auth_state');
        
        if (state !== storedState) {
          throw new Error('Invalid OAuth state parameter');
        }
        
        // Process the authorization code
        const response = await supabase.functions.invoke('twitter-access-token', {
          body: { 
            code, 
            state,
            callbackType
          }
        });
        
        if (response.error) {
          throw new Error(response.error.message || 'Failed to complete X authentication');
        }
        
        if (response.data.magicLink && callbackType === 'login') {
          // If this is a login flow, use the magic link to authenticate
          const success = await completeXAuth(response.data.magicLink);
          if (!success) {
            throw new Error('Failed to authenticate with X');
          }
          
          // Navigate to dashboard with success parameter
          navigate(`/dashboard?x_auth_success=true&username=${response.data.username || ''}`);
          return;
        }
        
        // If this is a linking flow, navigate back to the dashboard or settings
        navigate(`/dashboard?x_auth_success=true&username=${response.data.username || ''}`);
      } catch (error) {
        console.error('Error processing X callback:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };
    
    processOAuthCallback();
  }, [searchParams, navigate, completeXAuth]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {isProcessing ? (
        <>
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Processing X Authentication</h1>
          <p className="text-muted-foreground">Please wait while we complete your authentication...</p>
        </>
      ) : error ? (
        <>
          <div className="text-destructive mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p>Redirecting to home page...</p>
        </>
      ) : (
        <>
          <div className="text-primary mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Successful</h1>
          <p className="text-muted-foreground">Successfully connected your X account!</p>
        </>
      )}
    </div>
  );
};

export default XCallback;
