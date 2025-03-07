
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>Welcome to Posted Pal, a service operated by AutoPilot RE LLC ("we," "our," or "us"). By accessing or using our website, mobile applications, or any of our services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms").</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Acceptance of Terms</h2>
            <p>By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Services.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will provide notice of any material changes by posting the new Terms on the Services. Your continued use of the Services after such notice constitutes your acceptance of the new Terms.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Service Description</h2>
            <p>Posted Pal provides AI-powered content creation, scheduling, and analytics tools for managing social media accounts, specifically for X (formerly Twitter). Our Services allow users to generate content, schedule posts, and analyze performance on their social media accounts.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Account Registration</h2>
            <p>To access certain features of our Services, you must register for an account. You agree to provide accurate and complete information during registration and to keep your account information updated. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Subscription and Billing</h2>
            <p>Some aspects of the Services require payment of fees. You agree to pay all fees in accordance with the pricing and payment terms presented to you for the Services. You will provide us with valid payment information at the time of purchase. All payments are non-refundable unless otherwise specified.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. User Content</h2>
            <p>You retain all rights to any content you submit, post, or display on or through the Services ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, transmit, and display such content for the purpose of providing and improving our Services.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Prohibited Conduct</h2>
            <p>You agree not to engage in any of the following prohibited activities: (i) copying, distributing, or disclosing any part of the Services; (ii) using any automated system to access the Services; (iii) transmitting any viruses, worms, or other harmful code; (iv) interfering with the proper working of the Services; (v) attempting to harm our systems or other users; or (vi) using our Services to generate content that violates X's terms of service or other applicable platform policies.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Third-Party Services</h2>
            <p>Our Services may contain links to third-party websites or services. We are not responsible for the content or practices of these third-party services. Your use of such services is subject to their terms and policies.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Intellectual Property</h2>
            <p>All content, features, and functionality of our Services, including but not limited to text, graphics, logos, icons, and software, are owned by us or our licensors and are protected by copyright, trademark, and other intellectual property laws.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Disclaimer of Warranties</h2>
            <p>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Limitation of Liability</h2>
            <p>IN NO EVENT WILL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICES.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Indemnification</h2>
            <p>You agree to indemnify and hold us harmless from any claims, losses, liabilities, expenses, damages, and costs, including reasonable attorneys' fees, arising from or relating to your use of the Services or your violation of these Terms.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Termination</h2>
            <p>We may terminate or suspend your account and access to the Services immediately, without prior notice or liability, for any reason, including if you breach these Terms.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">15. Governing Law</h2>
            <p>These Terms shall be governed by the laws of the State of Oklahoma, without regard to its conflict of law provisions.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">16. Contact Information</h2>
            <p>For questions about these Terms, please contact us at:</p>
            <p>AutoPilot RE LLC<br />
            PO BOX 97<br />
            Cromwell, OK 74837<br />
            Email: Support@automatere.com</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
