
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        navigate('/dashboard');
      }
    };
    
    checkUser();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          navigate('/dashboard');
        } else {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Basic validations
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }
      
      if (name.trim() === '') {
        setError('Name is required');
        setIsSubmitting(false);
        return;
      }
      
      if (email.trim() === '') {
        setError('Email is required');
        setIsSubmitting(false);
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Starting signup with:', { email, name });
      
      // Try to sign up directly with Supabase
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });
      
      console.log('Signup response:', data, signupError);
      
      if (signupError) {
        console.error('Signup error from Supabase:', signupError);
        setError(signupError.message);
        toast({
          title: "Sign Up Failed",
          description: signupError.message,
          variant: "destructive"
        });
        return;
      }
      
      if (data?.user) {
        console.log('Signup successful, user created:', data.user);
        toast({
          title: "Account Created",
          description: "Your account has been created successfully. Redirecting to dashboard...",
        });
        
        // Wait a moment before redirecting to make sure the toast is shown
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        console.warn('Signup completed but no user data returned');
        setError('Account created but login failed. Please try logging in.');
      }
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to sign up',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 mt-16">
        <div className="w-full max-w-md">
          <Card className="glass-card animate-scale-in">
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
                    minLength={6}
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
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create account"}
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
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SignUp;
