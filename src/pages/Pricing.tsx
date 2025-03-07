
import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for casual content creators',
    features: [
      'Up to 10 posts per month',
      'Basic analytics',
      'AI content generation',
      'Schedule posts in advance',
      'Email support',
    ],
    limitations: [
      'Limited analytics history',
      'No video creation tools',
      'Standard AI models only',
    ],
    ctaText: 'Get Started',
    popular: false,
    color: 'from-blue-400 to-blue-500',
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'For content creators who post regularly',
    features: [
      'Up to 200 posts per month',
      'Advanced analytics',
      'Priority AI generation',
      'Custom posting schedules',
      'Priority email support',
      'Content performance insights',
    ],
    limitations: [
      'No video creation tools',
    ],
    ctaText: 'Upgrade to Pro',
    popular: true,
    color: 'from-purple-500 to-blue-500',
  },
  {
    name: 'Ultimate',
    price: '$49',
    period: 'per month',
    description: 'For professional content creators and teams',
    features: [
      'Up to 5000 posts per month',
      'Comprehensive analytics',
      'Advanced AI models',
      'Video creator tools',
      'Team collaboration features',
      'Dedicated support',
      'API access',
      'Custom branding',
    ],
    limitations: [],
    ctaText: 'Upgrade to Ultimate',
    popular: false,
    color: 'from-purple-600 to-blue-600',
  },
];

const PricingCard: React.FC<{
  tier: typeof pricingTiers[0];
}> = ({ tier }) => {
  const { user } = useAuth();
  
  return (
    <Card className={`flex flex-col h-full transition-all duration-200 ${tier.popular ? 'shadow-xl scale-105 border-primary/30 z-10' : 'shadow-md hover:shadow-lg'}`}>
      <CardHeader className={`pb-8 ${tier.popular ? 'pt-8' : 'pt-6'}`}>
        {tier.popular && (
          <div className="absolute top-0 inset-x-0 -mt-4 flex justify-center">
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
              MOST POPULAR
            </span>
          </div>
        )}
        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
        <div className="mt-2 flex items-baseline">
          <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
          <span className="ml-1 text-muted-foreground">/{tier.period}</span>
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
          {tier.limitations.map((limitation, index) => (
            <li key={index} className="flex items-start text-muted-foreground">
              <X className="h-5 w-5 mr-2 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span>{limitation}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-6">
        <Link to={user ? '/settings' : '/signup'} className="w-full">
          <Button 
            className={`w-full bg-gradient-to-r ${tier.color} hover:shadow-md transition-all duration-200`}
            size="lg"
          >
            {tier.ctaText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-24 bg-gradient-to-b from-background to-neutral-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your content creation needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mt-8 px-4 md:px-0">
            {pricingTiers.map((tier, index) => (
              <PricingCard key={index} tier={tier} />
            ))}
          </div>
          
          <div className="mt-20 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="mt-8 space-y-6 text-left">
              <div>
                <h3 className="font-medium text-lg">Can I upgrade or downgrade my plan anytime?</h3>
                <p className="text-muted-foreground mt-1">Yes, you can change your plan at any time. When you upgrade, you'll be charged the prorated amount for the remainder of your billing cycle.</p>
              </div>
              <div>
                <h3 className="font-medium text-lg">Do unused posts roll over to the next month?</h3>
                <p className="text-muted-foreground mt-1">No, your post limit refreshes at the beginning of each billing cycle.</p>
              </div>
              <div>
                <h3 className="font-medium text-lg">Is there a free trial?</h3>
                <p className="text-muted-foreground mt-1">Yes! Our Free plan serves as an unlimited trial with limited features. You can upgrade whenever you're ready.</p>
              </div>
              <div>
                <h3 className="font-medium text-lg">How do I cancel my subscription?</h3>
                <p className="text-muted-foreground mt-1">You can cancel your subscription at any time from your account settings page. Your plan will remain active until the end of your current billing cycle.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-20 py-10 px-6 md:px-12 bg-blue-50 rounded-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Need a custom solution?</h2>
            <p className="text-lg mb-6 max-w-2xl mx-auto">We offer custom plans for agencies and large content teams with specific requirements.</p>
            <Link to="/contact">
              <Button size="lg" variant="outline">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
