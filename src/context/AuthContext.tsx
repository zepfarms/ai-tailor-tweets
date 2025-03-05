
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { startXOAuthFlow, clearOAuthParams, getStoredRedirectPage } from '@/lib/xOAuthUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkingX, setIsLinkingX] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          const { user: authUser } = sessionData.session;
          
          const appUser: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata.name || 'User',
            xLinked: false,
          };
          
          setUser(appUser);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        const authUser = session.user;
        
        const appUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata.name || 'User',
          xLinked: false,
        };
        
        setUser(appUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Check the URL for OAuth callback parameters from X
    const checkForXCallback = () => {
      const params = new URLSearchParams(window.location.search);
      // If we have the x_auth_success flag, it means the user was redirected back
      // from the XCallback page after successful auth
      if (params.get('x_auth_success') === 'true') {
        const username = params.get('username');
        if (username && user) {
          const updatedUser = {
            ...user,
            xLinked: true,
            xUsername: `@${username}`,
          };
          setUser(updatedUser);
          
          // Get the stored redirect page and navigate back
          const redirectTo = getStoredRedirectPage();
          
          // Clean up URL parameters
          if (window.history && window.history.replaceState) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
          
          // Show success message and navigate
          toast({
            title: "X Account Linked",
            description: `Successfully linked to @${username}`,
          });
          
          navigate(redirectTo);
        }
      }
    };
    
    checkForXCallback();
  }, [user, toast, navigate]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast({
          title: "Account created",
          description: "Welcome to PostAI!",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
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

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      navigate('/');
      toast({
        title: "Logged out",
        description: "You've been successfully logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const linkXAccount = async () => {
    if (isLinkingX) return; // Prevent multiple simultaneous attempts
    
    setIsLinkingX(true);
    
    try {
      console.log('Initiating X account linking');
      
      // Clear any existing OAuth parameters
      clearOAuthParams();
      
      toast({
        title: "X Authorization Started",
        description: "Redirecting to X for authorization...",
      });
      
      // This will now redirect the user to Twitter directly
      await startXOAuthFlow();
      
    } catch (error) {
      console.error('Error initiating X account linking:', error);
      toast({
        title: "Failed to link X account",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      setIsLinkingX(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isLinkingX,
      login, 
      signup, 
      logout, 
      linkXAccount 
    }}>
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
