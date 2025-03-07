
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const SignUp: React.FC = () => {
  const { signup, isLoading, user, isVerifying, verifyOtp, hasSubscription, updateSubscriptionStatus } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const navigate = useNavigate();
  
  // Check if user is already verified and logged in
  useEffect(() => {
    if (user && !isLoading && !isVerifying) {
      // Force a subscription status check
      updateSubscriptionStatus().then(hasActive => {
        if (hasActive) {
          navigate('/dashboard');
        } else {
          navigate('/subscription');
        }
      });
    } else if (isVerifying) {
      setShowVerification(true);
    }
  }, [user, isLoading, isVerifying, navigate, updateSubscriptionStatus]);

  // Handle resend cooldown timer
  useEffect(() => {
    let timer: number | undefined;
    if (resendCountdown > 0) {
      timer = window.setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    } else if (resendCountdown === 0) {
      setResendDisabled(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      // Use email as name for simplified flow
      const name = email.split('@')[0];
      const result = await signup(email, password, name);
      if (result?.success) {
        setShowVerification(true);
        toast({
          title: "Verification code sent",
          description: "Please check your email for the verification code.",
        });
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    
    try {
      await verifyOtp(email, verificationCode);
      toast({
        title: "Verification successful",
        description: "Your email has been verified successfully!",
      });
      
      // After verification, direct to subscription page
      navigate('/subscription');
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify code');
      
      // If error contains "expired", show a more helpful message
      if (err instanceof Error && 
          (err.message.toLowerCase().includes('expired') || 
           err.message.toLowerCase().includes('invalid'))) {
        setError('Verification code has expired or is invalid. Please request a new code.');
      }
    }
  };

  const handleResendCode = async () => {
    setResendDisabled(true);
    setResendCountdown(60); // 60 second cooldown
    
    try {
      // Use email as name for simplified flow
      const name = email.split('@')[0];
      const result = await signup(email, password, name);
      if (result?.success) {
        toast({
          title: "Verification code resent",
          description: "Please check your email for the new verification code.",
        });
      }
    } catch (err) {
      console.error('Resend error:', err);
      // Handle "User already registered" error more gracefully
      if (err instanceof Error && err.message.includes('already registered')) {
        toast({
          title: "Verification code resent",
          description: "Please check your email for the new verification code.",
        });
      } else {
        setError(err instanceof Error ? err.message : 'Failed to resend verification code');
        setResendDisabled(false);
        setResendCountdown(0);
      }
    }
  };

  // Show loading state only when signing up, not during initial auth check
  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center page-transition">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-4">Creating your account...</h2>
          <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 mt-16">
        <div className="w-full max-w-md">
          <Breadcrumb
            segments={[
              { name: "Sign Up", href: "/signup" }
            ]}
            className="mb-6"
          />
          
          <Card className="glass-card animate-scale-in">
            {!showVerification ? (
              <>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                  <CardDescription className="text-center">
                    Enter your email and create a password
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input 
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Continue to Payment"}
                    </Button>
                  </form>
                </CardContent>
                
                <CardFooter>
                  <div className="text-sm text-center w-full">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium">
                      Log in
                    </Link>
                  </div>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
                  <CardDescription className="text-center">
                    We've sent a verification code to {email || "your email"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verificationCode">Verification Code</Label>
                      <Input 
                        id="verificationCode"
                        type="text"
                        placeholder="Enter the 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                      />
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Verifying..." : "Verify and Continue"}
                    </Button>
                  </form>
                </CardContent>
                
                <CardFooter className="flex flex-col">
                  <div className="text-sm text-center w-full">
                    Didn't receive a code?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-500 hover:text-blue-600 font-medium"
                      onClick={handleResendCode}
                      disabled={resendDisabled}
                    >
                      {resendDisabled 
                        ? `Resend (${resendCountdown}s)` 
                        : "Resend"}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-4 text-center">
                    The verification code will expire after 30 minutes. If it expires, you can request a new one.
                  </div>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
