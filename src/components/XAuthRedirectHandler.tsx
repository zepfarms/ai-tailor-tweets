
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const XAuthRedirectHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeXAuth } = useAuth();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processXCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        console.error('X authentication error:', error, errorDescription);
        setStatus('error');
        setErrorMessage(errorDescription || 'X authentication failed');
        
        toast({
          title: 'X Authentication Failed',
          description: errorDescription || 'Could not authenticate with X. Please try again.',
          variant: 'destructive',
        });
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
        
        return;
      }
      
      if (!code || !state) {
        console.error('Missing required parameters', { code, state });
        setStatus('error');
        setErrorMessage('Missing required authentication parameters');
        
        toast({
          title: 'Authentication Error',
          description: 'Missing required authentication parameters.',
          variant: 'destructive',
        });
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
        
        return;
      }
      
      try {
        // Exchange code for access token
        const tokenResponse = await supabase.functions.invoke('twitter-access-token', {
          body: { code, state }
        });
        
        if (tokenResponse.error) {
          throw new Error(tokenResponse.error.message);
        }
        
        const { success, action, username, token } = tokenResponse.data;
        
        if (success) {
          setStatus('success');
          
          if (action === 'link') {
            // Handle account linking success
            toast({
              title: 'X Account Linked',
              description: `Your X account @${username} has been successfully connected.`,
            });
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else if (action === 'login' || action === 'signup') {
            // Handle login success
            if (completeXAuth && token) {
              await completeXAuth(token);
            } else {
              toast({
                title: 'X Authentication Successful',
                description: `Logged in as @${username}`,
              });
              
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            }
          }
        } else {
          throw new Error('Failed to process X authentication');
        }
      } catch (error) {
        console.error('Error processing X callback:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        
        toast({
          title: 'Authentication Error',
          description: error instanceof Error ? error.message : 'Failed to complete X authentication.',
          variant: 'destructive',
        });
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };
    
    processXCallback();
  }, [searchParams, navigate, toast, completeXAuth]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Processing X Authentication</h1>
          <p className="text-muted-foreground">Please wait while we complete the process...</p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <div className="text-green-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Successful!</h1>
          <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
        </>
      )}
      
      {status === 'error' && (
        <>
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
          <p className="text-red-500 mb-2">{errorMessage}</p>
          <p className="text-muted-foreground">Redirecting you to the home page...</p>
        </>
      )}
    </div>
  );
};

export default XAuthRedirectHandler;
