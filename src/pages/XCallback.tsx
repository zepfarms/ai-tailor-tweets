
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const XCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the query parameters from the URL
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        const state = queryParams.get('state');
        const error = queryParams.get('error');
        
        console.log('X Callback received:', { code, state, error });
        
        if (error) {
          setError(`Twitter authorization error: ${error}`);
          setTimeout(() => navigate('/settings'), 3000);
          return;
        }
        
        if (!code || !state) {
          setError('Missing required parameters from Twitter');
          setTimeout(() => navigate('/settings'), 3000);
          return;
        }

        // Exchange the code for an access token
        const { data, error: tokenError } = await supabase.functions.invoke('twitter-access-token', {
          body: { code, state, redirectUri: window.location.origin + '/x-callback' },
        });

        if (tokenError) {
          console.error('Error exchanging code for token:', tokenError);
          setError(tokenError.message);
          setTimeout(() => navigate('/settings'), 3000);
          return;
        }

        console.log('Twitter account linked successfully');
        
        // Success! Redirect to the settings page
        setTimeout(() => navigate('/settings'), 1000);
      } catch (err) {
        console.error('Error in X callback processing:', err);
        setError('An unexpected error occurred. Please try again.');
        setTimeout(() => navigate('/settings'), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [location.search, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {isProcessing ? (
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connecting your X account</h1>
          <p className="text-muted-foreground">Please wait while we finalize the connection...</p>
        </div>
      ) : error ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-destructive">Connection Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p>Redirecting you back to settings...</p>
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-success">Success!</h1>
          <p className="text-muted-foreground">Your X account has been connected successfully.</p>
          <p>Redirecting you back to settings...</p>
        </div>
      )}
    </div>
  );
};

export default XCallback;
