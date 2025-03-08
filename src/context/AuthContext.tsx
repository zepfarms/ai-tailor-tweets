import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType, PostToXData } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionStatus } from '@/lib/stripe';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkingX, setIsLinkingX] = useState(false);
  const [isLoginingWithX, setIsLoginingWithX] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          const { user: authUser } = sessionData.session;
          
          if (authUser && !authUser.email_confirmed_at) {
            setIsVerifying(true);
            setIsLoading(false);
            return;
          }
          
          const appUser: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata.name || 'User',
            xLinked: false,
          };
          
          setUser(appUser);

          if (authUser.email === 'zepfarms@gmail.com' || appUser.email === 'demo@postedpal.com') {
            console.log('Master/demo user detected, setting subscription to true');
            setHasSubscription(true);
          } else {
            setHasSubscription(false);
          }
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
    const checkXAccount = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('x_accounts')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (data && !error) {
            setUser(prevUser => {
              if (!prevUser) return prevUser;
              return {
                ...prevUser,
                xLinked: true,
                xUsername: `@${data.x_username}`,
              };
            });
          }
        } catch (error) {
          console.error('Error checking X account:', error);
        }
      }
    };
    
    checkXAccount();
  }, [user?.id]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        const authUser = session.user;
        
        if (!authUser.email_confirmed_at) {
          setIsVerifying(true);
          navigate('/signup');
          return;
        }
        
        const appUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata.name || 'User',
          xLinked: false,
        };
        
        setUser(appUser);
        setIsVerifying(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsVerifying(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      if (email === 'demo@postedpal.com' && password === 'demopassword123') {
        const demoUser: User = {
          id: 'demo-user-id',
          email: 'demo@postedpal.com',
          name: 'Demo User',
          xLinked: true,
          xUsername: '@demouser',
          isDemoAccount: true
        };
        
        setUser(demoUser);
        setHasSubscription(true);
        
        toast({
          title: "Demo Login successful",
          description: "You're now using a demo account with sample data",
        });
        navigate('/dashboard');
        setIsLoading(false);
        return;
      }
      
      if (email === 'zepfarms@gmail.com') {
        setHasSubscription(true);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        let hasActive = email === 'zepfarms@gmail.com' || email === 'demo@postedpal.com';
        setHasSubscription(hasActive);
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        if (hasActive) {
          navigate('/dashboard');
        } else {
          navigate('/subscription');
        }
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

  const loginWithX = async () => {
    try {
      setIsLoginingWithX(true);
      
      const origin = window.location.origin;
      
      const response = await supabase.functions.invoke('twitter-request-token', {
        body: { 
          isLogin: true,
          origin 
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to initialize X authentication");
      }
      
      if (!response.data || !response.data.authUrl) {
        throw new Error("Invalid response from authentication service");
      }
      
      if (response.data.state) {
        localStorage.setItem('x_auth_state', response.data.state);
      }
      
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error logging in with X account:', error);
      toast({
        title: "X Login Error",
        description: error instanceof Error ? error.message : "Failed to login with X",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoginingWithX(false);
    }
  };

  const completeXAuth = async (magicLink: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email: magicLink
      });
      
      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "You've been logged in with your X account!",
      });
      
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error('X auth completion error:', error);
      toast({
        title: "X Login Failed",
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
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { data: existingUserData, error: existingUserError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      
      let isResend = false;
      let existingUser = null;
      
      const { data: sessionData } = await supabase.auth.getSession();
      const matchingUser = sessionData?.session?.user;
      if (matchingUser && matchingUser.email === email) {
        existingUser = matchingUser;
        isResend = true;
      }
      
      if (existingUser || existingUserData?.user) {
        isResend = true;
        
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            if (!signInError.message.includes("Invalid login credentials")) {
              throw signInError;
            }
          }
          
          if (signInData?.user) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: { 
                name,
                verificationCode 
              }
            });
            
            if (updateError) throw updateError;
          }
        } catch (signInErr) {
          console.log("Unable to sign in existing user, but proceeding with verification code");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              verificationCode,
            },
            emailRedirectTo: 'https://www.postedpal.com/verify-email',
          },
        });
        
        if (error) {
          if (error.message.includes("already registered")) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (signInError) {
              if (!signInError.message.includes("Invalid login credentials")) {
                throw signInError;
              }
            }
            
            if (signInData?.user) {
              const { error: updateError } = await supabase.auth.updateUser({
                data: { 
                  name,
                  verificationCode 
                }
              });
              
              if (updateError) throw updateError;
            }
            
            isResend = true;
          } else {
            throw error;
          }
        }
      }
      
      const emailResponse = await supabase.functions.invoke('send-verification-email', {
        body: { email, name, verificationCode },
      });
      
      if (emailResponse.error) {
        throw new Error("Failed to send verification email");
      }
      
      toast({
        title: isResend ? "Verification code resent" : "Verification email sent",
        description: "Please check your email for a verification code",
      });
      
      setIsVerifying(true);
      return { success: true };
      
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

  const verifyOtp = async (email: string, token: string) => {
    setIsLoading(true);
    
    try {
      console.log(`Verifying OTP for ${email} with token ${token}`);
      
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData || !userData.user) {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'signup',
        });
        
        if (error) {
          if (error.message.includes("expired") || error.message.includes("invalid")) {
            throw new Error("Verification code has expired or is invalid. Please request a new code.");
          }
          throw error;
        }
        
        if (data.user) {
          toast({
            title: "Email verified",
            description: "Your account has been verified successfully!",
          });
          
          setIsVerifying(false);
          navigate('/dashboard');
          return true;
        }
        
        throw new Error("Verification failed. Please try again.");
      }
      
      const storedCode = userData.user.user_metadata?.verificationCode;
      
      console.log(`Stored code: ${storedCode}, Entered code: ${token}`);
      
      if (storedCode !== token) {
        throw new Error("Invalid verification code");
      }
      
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'signup',
        });
        
        if (error) {
          if (error.message.includes("expired") || error.message.includes("invalid")) {
            throw new Error("Verification code has expired or is invalid. Please request a new code.");
          }
          throw error;
        }
        
        if (data.user) {
          toast({
            title: "Email verified",
            description: "Your account has been verified successfully!",
          });
          
          setIsVerifying(false);
          navigate('/dashboard');
          return true;
        }
      } catch (verifyError) {
        console.error('OTP verification attempt failed:', verifyError);
        
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (sessionData && sessionData.session) {
            const timestamp = new Date().toISOString();
            const { error: updateError } = await supabase.auth.updateUser({
              data: { 
                email_confirmed: true,
                email_confirmed_at: timestamp
              }
            });
            
            if (!updateError) {
              toast({
                title: "Email verified",
                description: "Your account has been verified successfully!",
              });
              
              setIsVerifying(false);
              navigate('/dashboard');
              return true;
            }
          }
        } catch (fallbackError) {
          console.error('Fallback verification failed:', fallbackError);
        }
        
        if (verifyError instanceof Error && 
            (verifyError.message.toLowerCase().includes('expired') || 
             verifyError.message.toLowerCase().includes('invalid'))) {
          throw new Error('Verification code has expired or is invalid. Please request a new code.');
        }
        
        throw verifyError;
      }
      
      throw new Error("Verification failed. Please try again.");
    } catch (error) {
      console.error('OTP verification error:', error);
      toast({
        title: "Verification failed",
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
      setIsVerifying(false);
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

  const linkXAccount = async (redirectUri?: string): Promise<void> => {
    try {
      setIsLinkingX(true);
      
      if (!user?.id) {
        throw new Error("You must be logged in to connect your X account");
      }
      
      const origin = window.location.origin;
      
      const response = await supabase.functions.invoke('twitter-request-token', {
        body: { 
          userId: user.id,
          origin
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to initialize X authentication");
      }
      
      if (!response.data || !response.data.authUrl) {
        throw new Error("Invalid response from authentication service");
      }
      
      if (response.data.state) {
        localStorage.setItem('x_auth_state', response.data.state);
      }
      
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error linking X account:', error);
      toast({
        title: "X Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to X",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLinkingX(false);
    }
  };

  const postToX = async (data: PostToXData) => {
    try {
      if (!user?.id) {
        throw new Error("You must be logged in to post to X");
      }
      
      if (!user.xLinked) {
        throw new Error("Please connect your X account first");
      }
      
      const response = await supabase.functions.invoke('twitter-post', {
        body: {
          userId: user.id,
          content: data.content,
          media: data.media
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to post to X");
      }
      
      toast({
        title: "Posted to X",
        description: "Your content was successfully posted to X",
      });
      
      return response.data;
    } catch (error) {
      console.error('Error posting to X:', error);
      toast({
        title: "X Posting Error",
        description: error instanceof Error ? error.message : "Failed to post to X",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSubscriptionStatus = async () => {
    if (user?.id) {
      try {
        if (user.email === 'zepfarms@gmail.com' || user.email === 'demo@postedpal.com' || user.isDemoAccount) {
          setHasSubscription(true);
          return true;
        }
        
        setHasSubscription(false);
        return false;
      } catch (error) {
        console.error('Error updating subscription status:', error);
        return false;
      }
    }
    return false;
  };

  const updateUserPreferences = async (preferences: Partial<User>) => {
    try {
      if (!user) {
        throw new Error("No user is logged in");
      }
      
      console.log("Updating user preferences:", preferences);
      
      const { error } = await supabase.auth.updateUser({
        data: preferences
      });
      
      if (error) {
        console.error("Error updating user metadata:", error);
        throw error;
      }
      
      setUser(prev => {
        if (!prev) return prev;
        return { ...prev, ...preferences };
      });
      
      return true;
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isLinkingX,
      isLoginingWithX,
      isVerifying,
      hasSubscription,
      updateSubscriptionStatus,
      updateUserPreferences,
      login, 
      loginWithX,
      completeXAuth,
      signup, 
      logout, 
      linkXAccount,
      postToX,
      verifyOtp
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
