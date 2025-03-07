
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>This Cookie Policy explains how AutoPilot RE LLC ("we," "our," or "us") uses cookies and similar technologies on our Posted Pal website and application (the "Service"). This policy should be read alongside our Privacy Policy, which explains how we use personal information.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. What Are Cookies?</h2>
            <p>Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work efficiently and provide analytical information.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Types of Cookies We Use</h2>
            <p>We use the following types of cookies:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Essential Cookies:</strong> These cookies are necessary for the Service to function properly. They enable core functionality such as security, network management, and account access. You may disable these by changing your browser settings, but this may affect how the Service functions.</li>
              <li><strong>Performance/Analytics Cookies:</strong> These cookies allow us to recognize and count the number of visitors and see how visitors move around our Service. This helps us improve the way our Service works, for example, by ensuring that users are finding what they are looking for easily.</li>
              <li><strong>Functionality Cookies:</strong> These cookies are used to recognize you when you return to our Service. This enables us to personalize our content for you, greet you by name, and remember your preferences.</li>
              <li><strong>Targeting/Advertising Cookies:</strong> These cookies record your visit to our Service, the pages you have visited, and the links you have followed. We use this information to make our Service and the advertising displayed on it more relevant to your interests.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Cookies</h2>
            <p>In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service, deliver advertisements on and through the Service, and so on. These cookies may include:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Analytics Cookies:</strong> We use services like Google Analytics to help us understand how visitors engage with our Service.</li>
              <li><strong>Social Media Cookies:</strong> These cookies allow you to share content from our Service on social media platforms like X (formerly Twitter) and are set by these platforms.</li>
              <li><strong>Payment Processor Cookies:</strong> These cookies are essential for processing payments for our subscription services.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. How to Control Cookies</h2>
            <p>Most web browsers allow some control of most cookies through the browser settings. You can usually find these settings in the 'Options' or 'Preferences' menu of your browser. To understand these settings, the following links may be helpful:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><a href="https://support.google.com/chrome/answer/95647?hl=en" className="text-blue-600 hover:underline">Cookie settings in Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-blue-600 hover:underline">Cookie settings in Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-blue-600 hover:underline">Cookie settings in Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" className="text-blue-600 hover:underline">Cookie settings in Internet Explorer</a></li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Consequences of Disabling Cookies</h2>
            <p>If you disable cookies, some features of our Service may not function properly. This may include login sessions, preferences, and certain interactive features.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to Our Cookie Policy</h2>
            <p>We may update our Cookie Policy from time to time. We will post any changes on this page and, if the changes are significant, we will provide a more prominent notice.</p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Information</h2>
            <p>If you have any questions about our use of cookies, please contact us at:</p>
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

export default CookiePolicy;
