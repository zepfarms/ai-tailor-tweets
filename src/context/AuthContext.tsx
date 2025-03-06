
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkingX, setIsLinkingX] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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
            xLinked: true,
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
        
        const appUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata.name || 'User',
          xLinked: true,
        };
        
        setUser(appUser);
        
        // Check if user needs email verification
        if (!authUser.email_confirmed_at && authUser.confirmation_sent_at) {
          setIsVerifying(true);
          navigate('/signup'); // Keep on signup page for verification
        } else {
          setIsVerifying(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsVerifying(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const checkForXCallback = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('x_auth_success') === 'true') {
        const username = params.get('username');
        if (username && user) {
          const updatedUser = {
            ...user,
            xLinked: true,
            xUsername: `@${username}`,
          };
          setUser(updatedUser);
          
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          toast({
            title: "X Account Linked",
            description: `Successfully linked to @${username}`,
          });
        }
      }
    };
    
    checkForXCallback();
  }, [user, toast]);

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
      // Generate a unique verification code to prevent collisions
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check if user already exists to handle resend scenario
      const { data: existingUserData, error: existingUserError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      
      let isResend = false;
      
      // If user exists, handle as a resend
      if (existingUserData?.user) {
        isResend = true;
        
        // Update the user metadata with the new verification code
        const { error: updateError } = await supabase.auth.updateUser({
          data: { 
            name,
            verificationCode 
          }
        });
        
        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new user
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
          // Check if error is "User already registered"
          if (error.message.includes("already registered")) {
            // Try to sign in to get the session
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (signInError) throw signInError;
            
            // Update the verification code
            const { error: updateError } = await supabase.auth.updateUser({
              data: { 
                name,
                verificationCode 
              }
            });
            
            if (updateError) throw updateError;
            
            isResend = true;
          } else {
            throw error;
          }
        }
      }
      
      // Send verification email with our edge function
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
      
      // Get current user to check verification code
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData || !userData.user) {
        throw new Error("User not found");
      }
      
      const storedCode = userData.user.user_metadata?.verificationCode;
      
      console.log(`Stored code: ${storedCode}, Entered code: ${token}`);
      
      if (storedCode !== token) {
        throw new Error("Invalid verification code");
      }
      
      // Verify the user's email
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });
      
      if (error) {
        // If token expired, try to use email change verification instead
        const { data: emailVerifyData, error: emailVerifyError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });
        
        if (emailVerifyError) {
          throw emailVerifyError;
        }
        
        if (emailVerifyData.user) {
          toast({
            title: "Email verified",
            description: "Your account has been verified successfully!",
          });
          
          setIsVerifying(false);
          navigate('/dashboard');
          return true;
        }
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
      
      return false;
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

  const linkXAccount = async () => {
    if (user) {
      const updatedUser = {
        ...user,
        xLinked: true,
        xUsername: user.xUsername || '@user',
      };
      
      setUser(updatedUser);
      
      toast({
        title: "X Integration Ready",
        description: "You can now post to X using the 'Post to X' button",
      });
      
      return Promise.resolve();
    }
    
    return Promise.reject(new Error('No user logged in'));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isLinkingX,
      isVerifying,
      login, 
      signup, 
      logout, 
      linkXAccount,
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
