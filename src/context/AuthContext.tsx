
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { startXOAuthFlow, clearOAuthParams } from '@/lib/xOAuthUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUser: User = {
  id: "1",
  email: "user@example.com",
  name: "Demo User",
  xLinked: false
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    
    if (loggedInUser) {
      try {
        setUser(JSON.parse(loggedInUser));
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
        // If there's an error parsing, clear the invalid data
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
    
    // Also check for redirected user data
    const redirectUser = localStorage.getItem('auth_redirect_user');
    if (redirectUser && !loggedInUser) {
      try {
        setUser(JSON.parse(redirectUser));
        localStorage.setItem('user', redirectUser);
        localStorage.removeItem('auth_redirect_user');
      } catch (e) {
        console.error("Error parsing redirected user data:", e);
        localStorage.removeItem('auth_redirect_user');
      }
    }
  }, []);

  useEffect(() => {
    const handleXAuthSuccess = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === 'X_AUTH_SUCCESS'
      ) {
        console.log('Received X auth success event:', event.data);
        
        if (user) {
          const updatedUser = {
            ...user,
            xLinked: true,
            xUsername: `@${event.data.username}`,
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          toast({
            title: "X Account Linked",
            description: `Successfully linked to @${event.data.username}`,
          });
        } else {
          console.log('Received X auth success but no active user found');
          // Try to get from the auth_redirect_user
          const redirectUser = localStorage.getItem('auth_redirect_user');
          if (redirectUser) {
            try {
              const parsedUser = JSON.parse(redirectUser);
              const updatedUser = {
                ...parsedUser,
                xLinked: true,
                xUsername: `@${event.data.username}`,
              };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              localStorage.removeItem('auth_redirect_user');
              
              toast({
                title: "X Account Linked",
                description: `Successfully linked to @${event.data.username}`,
              });
            } catch (e) {
              console.error("Error processing redirected user for X auth:", e);
            }
          }
        }
      }
    };

    window.addEventListener('message', handleXAuthSuccess);
    return () => window.removeEventListener('message', handleXAuthSuccess);
  }, [user, toast]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (email === "demo@example.com" && password === "password") {
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate('/dashboard');
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const newUser: User = {
        ...mockUser,
        email,
        name,
      };
      
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      toast({
        title: "Account created",
        description: "Welcome to PostAI!",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_redirect_user');
    setUser(null);
    // Also clear any OAuth params to ensure clean state
    clearOAuthParams();
    navigate('/');
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
  };

  const linkXAccount = async () => {
    try {
      console.log('Initiating X account linking');
      
      // Clear any existing OAuth params first to ensure clean state
      clearOAuthParams();
      
      // Store the current user for retrieval after the OAuth flow
      if (user) {
        localStorage.setItem('auth_redirect_user', JSON.stringify(user));
        console.log('Stored current user for retrieval after OAuth flow');
      }
      
      // Start the OAuth flow
      const authUrl = await startXOAuthFlow();
      
      console.log('Opening X authorization URL:', authUrl);
      const popup = window.open(authUrl, 'xAuthWindow', 'width=600,height=800');
      
      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "X Authorization Started",
          description: "Please complete the authorization in the popup window",
        });
        
        // Focus the popup to ensure user attention
        popup.focus();
      }
      
    } catch (error) {
      console.error('Error initiating X account linking:', error);
      
      // Clear any partial OAuth data
      clearOAuthParams();
      
      toast({
        title: "Failed to link X account",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, linkXAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
