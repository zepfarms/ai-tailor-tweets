
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const XCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code and state from the URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) {
          throw new Error('No authorization code received');
        }
        
        if (!state) {
          throw new Error('No state parameter received');
        }
        
        console.log('Exchanging code for access token...');
        
        // Call Supabase Edge Function
        const { data, error: functionError } = await supabase.functions.invoke('twitter-access-token', {
          body: { code, state, redirectUri: window.location.origin + '/x-callback' }
        });
        
        if (functionError) {
          console.error('Error from twitter-access-token function:', functionError);
          throw new Error(functionError.message || 'Failed to exchange code');
        }
        
        if (!data) {
          throw new Error('No response data received');
        }
        
        console.log('Access token response received:', data);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.success && data.username) {
          console.log('Successfully linked X account for:', data.username);
          // Redirect to dashboard with success parameter
          navigate(`/dashboard?x_auth_success=true&username=${data.username}`);
        } else {
          throw new Error('Failed to link X account: No success confirmation received');
        }
      } catch (err) {
        console.error('Error in X callback:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        
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
  }, [navigate, toast, location.search]);
  
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
