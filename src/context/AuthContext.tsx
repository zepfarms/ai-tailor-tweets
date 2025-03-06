
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
          
          if (authUser && !authUser.email_confirmed_at) {
            setIsVerifying(true);
            setIsLoading(false);
            return;
          }
          
          const appUser: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata.name || 'User',
            xLinked: false, // Initialize as false, will check in the next useEffect
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
        
        if (!authUser.email_confirmed_at) {
          setIsVerifying(true);
          navigate('/signup'); // Keep on signup page for verification
          return;
        }
        
        const appUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata.name || 'User',
          xLinked: false, // Initialize as false, will check in separate effect
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
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Use a different approach to check for existing users
      const { data: existingUserData, error: existingUserError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      
      let isResend = false;
      let existingUser = null;
      
      // Try to find any existing users through the session
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

  const linkXAccount = async () => {
    if (!user) {
      return Promise.reject(new Error('No user logged in'));
    }
    
    setIsLinkingX(true);
    
    try {
      // Call the Twitter request token function to get auth URL
      const response = await fetch(
        `${window.location.origin}/.netlify/functions/twitter-request-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.authUrl) {
        // Store code verifier and state in local storage
        localStorage.setItem('x_code_verifier', data.codeVerifier);
        localStorage.setItem('x_state', data.state);
        localStorage.setItem('x_user_id', user.id);
        
        // Redirect to Twitter auth URL
        window.location.href = data.authUrl;
        return Promise.resolve();
      } else {
        throw new Error('No auth URL returned');
      }
    } catch (error) {
      console.error('Error initiating X auth:', error);
      setIsLinkingX(false);
      return Promise.reject(error);
    }
  };

  // We'll remove this function as it's causing errors and not included in the AuthContextType
  // The sendVerificationCode function is removed

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
