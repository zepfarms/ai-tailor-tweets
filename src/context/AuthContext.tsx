
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";

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
      // Mock X account linking
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (user) {
        const updatedUser = { ...user, xLinked: true, xUsername: "@user" };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast({
          title: "X account linked",
          description: "Your X account has been successfully linked",
        });
      }
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
