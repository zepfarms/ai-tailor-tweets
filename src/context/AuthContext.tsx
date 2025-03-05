
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { startXOAuthFlow, clearOAuthParams } from '@/lib/xOAuthUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize session on load
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        
        // Check for existing Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData.user) {
            const currentUser: User = {
              id: userData.user.id,
              email: userData.user.email || '',
              name: userData.user.user_metadata.name || '',
              xLinked: false // We'll check X linking status separately
            };
            
            // Check if user has linked X account
            const { data: xAccount } = await supabase
              .from('x_accounts')
              .select('*')
              .eq('user_id', userData.user.id)
              .maybeSingle();
              
            if (xAccount) {
              currentUser.xLinked = true;
              currentUser.xUsername = `@${xAccount.x_username}`;
            }
            
            console.log('Setting user from Supabase session:', currentUser);
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          }
        } else {
          console.log('No active Supabase session found');
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error initializing auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session) {
          const userData = session.user;
          const currentUser: User = {
            id: userData.id,
            email: userData.email || '',
            name: userData.user_metadata.name || '',
            xLinked: false
          };
          
          // Check if user has linked X account
          const { data: xAccount } = await supabase
            .from('x_accounts')
            .select('*')
            .eq('user_id', userData.id)
            .maybeSingle();
            
          if (xAccount) {
            currentUser.xLinked = true;
            currentUser.xUsername = `@${xAccount.x_username}`;
          }
          
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('user');
        }
      }
    );
    
    // Check for X auth success on start
    const xAuthSuccess = localStorage.getItem('x_auth_success');
    const xAuthTimestamp = localStorage.getItem('x_auth_timestamp');
    
    if (xAuthSuccess === 'true' && xAuthTimestamp) {
      const timestamp = parseInt(xAuthTimestamp, 10);
      const now = Date.now();
      if (now - timestamp < 30000) {
        toast({
          title: "X Account Linked",
          description: "Your X account has been successfully linked!",
        });
        
        if (user) {
          // We'll update the user with the X link status
          const updatedUser = {
            ...user,
            xLinked: true,
            xUsername: user.xUsername || '@user',
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        localStorage.removeItem('x_auth_success');
        localStorage.removeItem('x_auth_timestamp');
      }
    }
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle X auth success message from OAuth popup
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
          toast({
            title: "Authentication Error",
            description: "Please log in before linking your X account",
            variant: "destructive",
          });
        }
      }
    };

    window.addEventListener('message', handleXAuthSuccess);
    return () => window.removeEventListener('message', handleXAuthSuccess);
  }, [user, toast]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Use Supabase authentication
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
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
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
      // Use Supabase authentication
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
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
      console.error("Signup error:", error);
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
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      localStorage.removeItem('auth_redirect_user');
      clearOAuthParams();
      navigate('/');
      toast({
        title: "Logged out",
        description: "You've been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const linkXAccount = async () => {
    try {
      console.log('Initiating X account linking');
      
      clearOAuthParams();
      
      if (user) {
        localStorage.setItem('auth_redirect_user', JSON.stringify(user));
        console.log('Stored current user for retrieval after OAuth flow:', user);
      } else {
        console.error('Cannot link X account - no active user');
        toast({
          title: "Error",
          description: "You must be logged in to link an X account",
          variant: "destructive",
        });
        return;
      }
      
      // Call startXOAuthFlow and catch potential errors
      try {
        const authUrl = await startXOAuthFlow();
        console.log('Opening X authorization URL:', authUrl);
        
        // Open popup with error handling
        const popup = window.open(authUrl, 'xAuthWindow', 'width=600,height=800');
        
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
          
          popup.focus();
        }
      } catch (error) {
        console.error('Error getting X authorization URL:', error);
        toast({
          title: "Failed to start X authorization",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error initiating X account linking:', error);
      
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
