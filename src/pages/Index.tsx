
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Navbar from '@/components/Navbar';
import { FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const pricingTiers = [
  {
    name: 'Demo',
    price: 'Free',
    period: '',
    description: 'Try the platform with demo data',
    features: [
      'Explore the full dashboard',
      'Test post creation features',
      'Sample analytics data',
      'Preview scheduling tools',
      'No credit card required',
    ],
    ctaText: 'Try Demo Now',
    popular: false,
    color: 'from-blue-400 to-blue-500',
    isDemoAccount: true,
  },
  {
    name: 'Posted Pal Pro',
    price: '$29',
    period: 'per month',
    description: 'Everything you need for content creation and scheduling',
    features: [
      'Unlimited posts per month',
      'Advanced analytics',
      'AI-powered content generation',
      'Custom posting schedules',
      'Video creator tools',
      'Team collaboration features',
      'Priority support',
      'Custom branding',
    ],
    ctaText: 'Get Started',
    popular: true,
    color: 'from-purple-500 to-blue-500',
    isDemoAccount: false,
  }
];

const PricingCard: React.FC<{
  tier: typeof pricingTiers[0];
}> = ({ tier }) => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleDemoLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await login('demo@postedpal.com', 'demopassword123');
      toast({
        title: "Demo Login Successful",
        description: "You're now using a demo account with sample data",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Demo Login Failed",
        description: "Unable to access demo account. Please try again later.",
      });
    }
  };
  
  return (
    <Card className={`flex flex-col h-full transition-all duration-200 ${tier.popular ? 'shadow-xl scale-105 border-primary/30 z-10' : 'shadow-md hover:shadow-lg'}`}>
      <CardHeader className={`pb-8 ${tier.popular ? 'pt-8' : 'pt-6'}`}>
        {tier.popular && (
          <div className="absolute top-0 inset-x-0 -mt-4 flex justify-center">
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
              FULL FEATURED
            </span>
          </div>
        )}
        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
        <div className="mt-2 flex items-baseline">
          <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
          <span className="ml-1 text-muted-foreground">{tier.period}</span>
        </div>
        <CardDescription className="mt-2">{tier.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-6">
        {tier.isDemoAccount ? (
          <Button 
            className={`w-full bg-gradient-to-r ${tier.color} hover:shadow-md transition-all duration-200`}
            size="lg"
            onClick={handleDemoLogin}
          >
            {tier.ctaText}
          </Button>
        ) : (
          <Link to={user ? '/settings' : '/signup'} className="w-full">
            <Button 
              className={`w-full bg-gradient-to-r ${tier.color} hover:shadow-md transition-all duration-200`}
              size="lg"
            >
              {tier.ctaText}
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        
        {/* Pricing Section */}
        <section className="py-24 bg-gradient-to-b from-neutral-50 to-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-muted-foreground">
                Choose the plan that fits your content creation needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-8 px-4 md:px-0 max-w-4xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <PricingCard key={index} tier={tier} />
              ))}
            </div>
            
            {/* FAQ Section */}
            <div className="mt-20 text-center max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <div className="mt-8 space-y-6 text-left">
                <div>
                  <h3 className="font-medium text-lg">Can I upgrade or downgrade my plan anytime?</h3>
                  <p className="text-muted-foreground mt-1">Yes, you can change your plan at any time. When you upgrade, you'll be charged the prorated amount for the remainder of your billing cycle.</p>
                </div>
                <div>
                  <h3 className="font-medium text-lg">Is there a free trial?</h3>
                  <p className="text-muted-foreground mt-1">Yes! Our demo account serves as an unlimited trial with sample data so you can test all the features.</p>
                </div>
                <div>
                  <h3 className="font-medium text-lg">How do I cancel my subscription?</h3>
                  <p className="text-muted-foreground mt-1">You can cancel your subscription at any time from your account settings page. Your plan will remain active until the end of your current billing cycle.</p>
                </div>
              </div>
            </div>
            
            {/* Custom Solution CTA */}
            <div className="mt-20 py-10 px-6 md:px-12 bg-blue-50 rounded-3xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Need a custom solution?</h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">We offer custom plans for agencies and large content teams with specific requirements.</p>
              <Link to="/contact">
                <Button size="lg" variant="outline">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 py-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
              <FileText size={14} />
              <span>Terms of Service</span>
            </Link>
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
              <FileText size={14} />
              <span>Privacy Policy</span>
            </Link>
          </div>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Posted Pal. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
