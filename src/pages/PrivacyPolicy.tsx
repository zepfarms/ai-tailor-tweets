
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>AutoPilot RE LLC ("we," "our," or "us") respects your privacy and is committed to protecting it through our compliance with this Privacy Policy. This policy describes the types of information we may collect from you or that you may provide when you use our Posted Pal service (the "Service") and our practices for collecting, using, maintaining, protecting, and disclosing that information.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
            <p>We collect several types of information from and about users of our Service, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Personal information (such as name, email address, and payment information) that you provide when registering for our Service, subscribing to our newsletter, or purchasing a subscription.</li>
              <li>Information about your social media accounts that you connect to our Service, including access tokens, profile information, and content.</li>
              <li>Information about your interactions with the Service, such as usage data, preferences, and performance metrics.</li>
              <li>Technical information, including your IP address, browser type, operating system, and device information.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Collect Information</h2>
            <p>We collect information directly from you when you provide it to us, automatically as you navigate through the Service, and from third parties, such as social media platforms that you connect to our Service.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. How We Use Your Information</h2>
            <p>We use information that we collect about you or that you provide to us:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>To provide, maintain, and improve our Service.</li>
              <li>To process your payments and manage your subscription.</li>
              <li>To communicate with you about the Service, including updates, security alerts, and support messages.</li>
              <li>To personalize your experience and deliver content relevant to your interests.</li>
              <li>To analyze and improve the safety and security of our Service.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Disclosure of Your Information</h2>
            <p>We may disclose aggregated information about our users and information that does not identify any individual without restriction. We may disclose personal information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>To our subsidiaries and affiliates.</li>
              <li>To contractors, service providers, and other third parties we use to support our business.</li>
              <li>To fulfill the purpose for which you provide it.</li>
              <li>For any other purpose disclosed by us when you provide the information.</li>
              <li>To comply with any court order, law, or legal process.</li>
              <li>To enforce our Terms of Service.</li>
              <li>If we believe disclosure is necessary to protect the rights, property, or safety of AutoPilot RE LLC, our customers, or others.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Security</h2>
            <p>We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. However, the transmission of information via the internet is not completely secure, and we cannot guarantee the security of your personal information transmitted to our Service.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights and Choices</h2>
            <p>You can review and change your personal information by logging into the Service and visiting your account profile page. You may also send us an email at Support@automatere.com to request access to, correct, or delete any personal information that you have provided to us.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
            <p>Our Service is not intended for children under 13 years of age, and we do not knowingly collect personal information from children under 13.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Our Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will post any changes on this page and, if the changes are significant, we will provide a more prominent notice.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Information</h2>
            <p>To ask questions or comment about this Privacy Policy and our privacy practices, contact us at:</p>
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

export default PrivacyPolicy;
