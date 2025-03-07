
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { X, Mail, FileText } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Contact Us</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Have questions or feedback? We'd love to hear from you.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Reach out on X</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <X className="h-5 w-5 mt-0.5 text-blue-600" />
                    <div>
                      <p className="text-muted-foreground mb-4">
                        The fastest way to get in touch with us is via X (formerly Twitter). 
                        Send us a message or mention us in your post!
                      </p>
                      <a 
                        href="https://www.x.com/postedpal" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center space-x-2"
                      >
                        <Button className="flex items-center gap-2">
                          <X size={18} />
                          <span>@postedpal</span>
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Email Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 mt-0.5 text-blue-600" />
                    <div>
                      <p className="text-muted-foreground mb-4">
                        If you prefer email, you can reach our support team at:
                      </p>
                      <a href="mailto:support@automatere.com" className="text-blue-600 hover:underline text-lg">
                        support@automatere.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="md:col-span-2">
                <Card className="bg-neutral-50 border border-neutral-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Connect with us</h3>
                    <p className="text-muted-foreground mb-4">
                      Follow us on X for the latest updates, tips, and announcements.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                      <a 
                        href="https://www.x.com/postedpal" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-block mb-4 sm:mb-0"
                      >
                        <Button variant="outline" className="flex items-center gap-2">
                          <X size={18} />
                          <span>Follow @postedpal</span>
                        </Button>
                      </a>
                      
                      <div className="flex items-center space-x-6">
                        <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
                          <FileText size={14} />
                          <span>Terms of Service</span>
                        </Link>
                        <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
                          <FileText size={14} />
                          <span>Privacy Policy</span>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-neutral-200 text-center text-xs text-muted-foreground">
                      © {new Date().getFullYear()} Posted Pal. All rights reserved.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
