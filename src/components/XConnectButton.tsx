
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from "lucide-react"
import { useToast } from '@/components/ui/use-toast';

interface XConnectButtonProps {
  showLoginOption?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  className?: string;
}

const XConnectButton: React.FC<XConnectButtonProps> = ({ 
  showLoginOption = false,
  variant = 'default',
  className = ''
}) => {
  const { user, linkXAccount, loginWithX, isLinkingX, isLoginingWithX } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  const handleXConnect = async () => {
    try {
      setIsConnecting(true);
      await linkXAccount();
    } catch (error) {
      console.error('Error connecting X account:', error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect X account"
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleXLogin = async () => {
    try {
      await loginWithX();
    } catch (error) {
      console.error('Error logging in with X:', error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: error instanceof Error ? error.message : "Failed to login with X"
      });
    }
  };
  
  // Determine which button to show
  if (showLoginOption) {
    return (
      <Button 
        variant="outline" 
        className={cn("flex items-center gap-2", className)}
        onClick={handleXLogin}
        disabled={isLoginingWithX}
      >
        {isLoginingWithX ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter">
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
          </svg>
        )}
        {isLoginingWithX ? "Connecting to X..." : "Login with X"}
      </Button>
    );
  }
  
  // For existing users to connect X account
  if (user?.xLinked) {
    return (
      <Button 
        variant={variant}
        className={cn("flex items-center gap-2", className)}
        onClick={handleXConnect}
        disabled={isLinkingX || isConnecting}
      >
        {isLinkingX || isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter">
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
          </svg>
        )}
        {isLinkingX || isConnecting ? "Reconnecting..." : "Reconnect X"}
      </Button>
    );
  }
  
  return (
    <Button 
      variant={variant}
      className={cn("flex items-center gap-2", className)}
      onClick={handleXConnect}
      disabled={isLinkingX || isConnecting}
    >
      {isLinkingX || isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      )}
      {isLinkingX || isConnecting ? "Connecting..." : "Connect X Account"}
    </Button>
  );
};

export default XConnectButton;
