import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden hero-gradient">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                AI-Powered Content for Your <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">X Profile</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl">
                Create, schedule, and post AI-generated content tailored to your audience and interests.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto button-glow group">
                  Get Started 
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Log in
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center text-white text-xs font-bold"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p>Trusted by thousands of content creators</p>
            </div>
          </div>
          
          <div className="relative animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-700/30 rounded-3xl blur-3xl -z-10 opacity-30"></div>
            <div className="glass-card p-6 md:p-8 rounded-3xl overflow-hidden shadow-soft transform hover:translate-y-[-5px] transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div>
                    <p className="font-medium">@ArtificialUser</p>
                    <p className="text-sm text-muted-foreground">Tech enthusiast • AI developer</p>
                  </div>
                </div>
                <div className="text-blue-500">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-4 mb-4">
                <p className="text-lg">
                  Just tested this new AI content tool for my X account - it analyzed my posting patterns and created tweets that sound exactly like me! 🤯 #PostedPal #ContentCreation
                </p>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>11:42 AM · Oct 21, 2023</span>
                  <div className="flex space-x-4">
                    <span>293 Reposts</span>
                    <span>1,482 Likes</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm">
                <span className="text-blue-500 hover:underline cursor-pointer">Created and scheduled with Posted Pal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background elements */}
      <div className="absolute top-1/3 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-700/10 rounded-full blur-3xl -z-10"></div>
    </section>
  );
};

export default Hero;
