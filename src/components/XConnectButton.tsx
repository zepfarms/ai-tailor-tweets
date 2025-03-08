
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { X, Link } from 'lucide-react';

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

  const handleConnect = async () => {
    if (!linkXAccount) return;
    
    setIsConnecting(true);
    try {
      await linkXAccount();
    } catch (error) {
      console.error('Error connecting to X:', error);
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
