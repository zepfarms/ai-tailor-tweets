
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SignUp: React.FC = () => {
  const { signup, isLoading, user, isVerifying, verifyOtp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const navigate = useNavigate();
  
  // Check if user is already verified and logged in
  useEffect(() => {
    if (user && !isLoading && !isVerifying) {
      navigate('/dashboard');
    } else if (isVerifying) {
      setShowVerification(true);
    }
  }, [user, isLoading, isVerifying, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const result = await signup(email, password, name);
      if (result?.success) {
        setShowVerification(true);
      }
    } catch (err) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
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
          <Card className="glass-card animate-scale-in">
            {!showVerification ? (
              <>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                  <CardDescription className="text-center">
                    Enter your information to create your account
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    
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
                      <div className="text-sm text-destructive">{error}</div>
                    )}
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create account"}
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
                      <div className="text-sm text-destructive">{error}</div>
                    )}
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Verifying..." : "Verify Email"}
                    </Button>
                  </form>
                </CardContent>
                
                <CardFooter>
                  <div className="text-sm text-center w-full">
                    Didn't receive a code?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-500 hover:text-blue-600 font-medium"
                      onClick={() => {
                        if (email && name) {
                          signup(email, password, name).catch(err => {
                            setError(err instanceof Error ? err.message : 'Failed to resend verification code');
                          });
                        } else {
                          setError('Email or name is missing. Please go back and try again.');
                        }
                      }}
                      disabled={isLoading}
                    >
                      Resend
                    </Button>
                  </div>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SignUp;
