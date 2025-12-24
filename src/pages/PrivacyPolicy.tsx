import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Mail className="h-6 w-6 text-accent" />
            <span className="text-lg font-semibold text-foreground">Gmail Automation</span>
          </div>
          <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Content */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="card-glass p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
            
            <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
              <p className="text-sm text-accent">Effective Date: December 24, 2025</p>
              
              <p>
                This Privacy Policy describes how we collect, use, and protect your information when you use our application (the "App"). By using the App, you agree to the terms of this Privacy Policy.
              </p>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">Gmail Access:</strong> The App requires access to your Gmail account to fetch and process your emails. This access is used solely for extracting details such as deadlines, upcoming events, and other workflow-related information.
                </li>
              </ul>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">Email Processing:</strong> Your emails are processed by both local and cloud-based AI systems to extract relevant information for your workflow.
                </li>
                <li>
                  <strong className="text-foreground">No Unnecessary Data Storage:</strong> We do not store your emails or extracted data longer than necessary to provide the App's features.
                </li>
                <li>
                  <strong className="text-foreground">No Sale of Data:</strong> We do not sell, rent, or share your personal information with third parties for marketing purposes.
                </li>
              </ul>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Data Security</h2>
              <p>
                We implement reasonable security measures to protect your information. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
              </p>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Third-Party Services</h2>
              <p>
                The App may use third-party cloud AI services for email processing. These services are required to comply with industry-standard privacy and security practices.
              </p>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Your Choices</h2>
              <p>
                You may revoke the App's access to your Gmail account at any time through your Google account settings. Deleting the App will also stop all data processing.
              </p>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted within the App or on our website.
              </p>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:support@example.com" className="text-accent hover:underline">
                  support@example.com
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-5 w-5" />
            <span className="text-sm">© 2024 Gmail Automation. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
