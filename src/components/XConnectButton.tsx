
import React from 'react';
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
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      console.log('Starting X authorization process');
      toast({
        title: "Connecting to X",
        description: "You'll be redirected to X for authorization...",
      });
      
      if (linkXAccount) {
        await linkXAccount();
      } else {
        throw new Error("Authentication context not initialized");
      }
    } catch (error) {
      console.error('Error connecting to X:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to X",
        variant: "destructive"
      });
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
        Connected
      </Button>
    );
  }

  return (
    <Button 
      className={className}
      variant={variant}
      size={size}
      onClick={handleConnect}
      disabled={isLinkingX}
    >
      <X className="mr-2 h-4 w-4" />
      {isLinkingX ? 'Connecting...' : 'Connect to X'}
    </Button>
  );
};

export default XConnectButton;
