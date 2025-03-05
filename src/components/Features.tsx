
import React from 'react';
import { MessageSquare, Calendar, Link, ArrowRight, RefreshCw, Zap } from 'lucide-react';

const features = [
  {
    icon: <MessageSquare className="w-10 h-10 text-blue-500" />,
    title: "AI-Powered Content",
    description: "Generate content that matches your voice and style with advanced AI technology."
  },
  {
    icon: <Calendar className="w-10 h-10 text-blue-500" />,
    title: "Smart Scheduling",
    description: "Plan your content calendar and automatically post at optimal times for engagement."
  },
  {
    icon: <Link className="w-10 h-10 text-blue-500" />,
    title: "X Integration",
    description: "Seamlessly connect your X account for posting without switching between platforms."
  },
  {
    icon: <RefreshCw className="w-10 h-10 text-blue-500" />,
    title: "Content Analysis",
    description: "Learn from your past posts to continuously improve content performance."
  },
  {
    icon: <Zap className="w-10 h-10 text-blue-500" />,
    title: "Instant Posting",
    description: "Create and share content immediately when inspiration strikes."
  },
  {
    icon: <ArrowRight className="w-10 h-10 text-blue-500" />,
    title: "Topic Selection",
    description: "Generate content based on your preferred topics and interests."
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-neutral-50" id="features">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold">
            Enhance Your Social Presence
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features to help you create engaging content and grow your audience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="glass-card p-6 rounded-xl transform transition-all duration-300 hover:translate-y-[-5px] hover:shadow-md space-y-4 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
