
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface XConnectButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const XConnectButton: React.FC<XConnectButtonProps> = ({ 
  className = '',
  variant = 'default',
  size = 'default'
}) => {
  const { user, linkXAccount, isLinkingX } = useAuth();
  const { toast } = useToast();
  const [localLoading, setLocalLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLocalLoading(true);
      console.log('Starting X authorization process');
      toast({
        title: "Connecting to X",
        description: "You'll be redirected to X for authorization...",
      });
      
      // Generate a fresh auth URL from the edge function each time
      console.log('Requesting authorization URL from server...');
      const { data, error } = await supabase.functions.invoke('twitter-request-token', {
        body: {
          userId: user?.id,
          isLogin: false
        }
      });
      
      if (error) {
        console.error('Error getting X authorization URL:', error);
        throw new Error(error.message || 'Failed to connect to X authorization service');
      }
      
      if (!data || !data.authUrl) {
        console.error('Invalid response from X authorization service:', data);
        throw new Error('Received invalid response from authorization service');
      }
      
      console.log('Received auth URL:', data.authUrl.substring(0, 100) + '...');
      console.log('State from response:', data.state);
      
      // Store the state in localStorage so we can verify it on return
      if (data.state) {
        localStorage.setItem('x_auth_state', data.state);
        console.log('Stored state in localStorage for verification:', data.state);
      } else {
        console.error('No state returned from authorization service');
        throw new Error('Authentication failed: No state returned from service');
      }
      
      // Redirect to Twitter/X for authorization
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error('Error connecting to X:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to X",
        variant: "destructive"
      });
      setLocalLoading(false);
    }
  };

  // Determine if button is in loading state (either from context or local state)
  const isLoading = isLinkingX || localLoading;

  if (user?.xLinked) {
    return (
      <Button 
        className={className}
        variant="secondary"
        size={size}
        disabled
      >
        <X className="mr-2 h-4 w-4" />
        Connected to X
      </Button>
    );
  }

  return (
    <Button 
      className={className}
      variant={variant}
      size={size}
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <X className="mr-2 h-4 w-4" />
          Connect to X
        </>
      )}
    </Button>
  );
};

export default XConnectButton;
