
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { startXOAuthFlow } from '@/lib/xOAuthUtils';

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data (in a real app, this would come from a backend)
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

  // Check if user is already logged in on mount
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Mock login delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // In a real app, this would validate credentials with a backend
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
      // Mock signup delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // In a real app, this would create a user in the backend
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
    setUser(null);
    navigate('/');
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
  };

  const linkXAccount = async () => {
    try {
      // Start the X OAuth flow
      const authUrl = await startXOAuthFlow();
      
      // Store current user state before redirecting
      if (user) {
        localStorage.setItem('auth_redirect_user', JSON.stringify(user));
      }
      
      // Open the X authorization page in a new window
      window.open(authUrl, 'xAuthWindow', 'width=600,height=600');
      
      toast({
        title: "X Authorization Started",
        description: "Please complete the authorization in the popup window",
      });
      
      // The rest of the flow will be handled by the callback page
      
    } catch (error) {
      toast({
        title: "Failed to link X account",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      throw error;
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
