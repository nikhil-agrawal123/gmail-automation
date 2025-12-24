import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService = () => {
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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
            
            <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
              <p className="text-sm text-accent">Effective Date: December 24, 2025</p>
              
              <p>
                These Terms of Service ("Terms") govern your use of our application (the "App"). By using the App, you agree to these Terms.
              </p>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Use of the App</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 13 years old to use the App.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You agree to use the App only for lawful purposes and in accordance with these Terms.</li>
              </ul>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Access to Gmail</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>The App requires access to your Gmail account to provide its features.</li>
                <li>You grant the App permission to access and process your emails for extracting deadlines, events, and workflow-related information.</li>
              </ul>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All content, trademarks, and intellectual property in the App are owned by the App developers or their licensors.</li>
                <li>You may not copy, modify, or distribute any part of the App without permission.</li>
              </ul>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Disclaimer</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>The App is provided "as is" without warranties of any kind.</li>
                <li>We do not guarantee the accuracy or completeness of information extracted from your emails.</li>
              </ul>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, we are not liable for any damages arising from your use of the App.
              </p>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Termination</h2>
              <p>
                We may suspend or terminate your access to the App at any time for violation of these Terms or for any other reason.
              </p>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the new Terms.
              </p>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Contact</h2>
              <p>
                If you have any questions about these Terms, please contact us at{' '}
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

export default TermsOfService;
