
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!linkXAccount) {
      toast({
        title: "Error",
        description: "Authentication context not initialized",
        variant: "destructive"
      });
      return;
    }
    
    setIsConnecting(true);
    try {
      toast({
        title: "Connecting to X",
        description: "You'll be redirected to X for authorization...",
      });
      
      // Directly call linkXAccount without delay - simplify the process
      await linkXAccount();
      // If we get here, that means the redirect didn't happen, so show error
      toast({
        title: "Connection Error",
        description: "Failed to redirect to X authentication page",
        variant: "destructive"
      });
      setIsConnecting(false);
    } catch (error) {
      console.error('Error connecting to X:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to X",
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };

  if (user?.xLinked) {
    return (
      <Button 
        className={className}
        variant="secondary"
        size={size}
        disabled
      >
        <X className="mr-2 h-4 w-4" />
        Connected to {user.xUsername}
      </Button>
    );
  }

  return (
    <Button 
      className={className}
      variant={variant}
      size={size}
      onClick={handleConnect}
      disabled={isConnecting || isLinkingX}
    >
      <X className="mr-2 h-4 w-4" />
      {isConnecting || isLinkingX ? 'Connecting...' : 'Connect to X'}
    </Button>
  );
};

export default XConnectButton;
