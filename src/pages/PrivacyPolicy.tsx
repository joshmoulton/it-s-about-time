import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground mt-1">
                Weekly Wizdom Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-slate max-w-none">
          <div className="bg-card rounded-lg border border-border p-6 sm:p-8 space-y-6">
            
            <div className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Weekly Wizdom LLC ("we," "our," "us") values your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, share, and safeguard your information.
              </p>
            </div>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  1. Information We Collect
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  We may collect information you provide through:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-foreground mb-4">
                  <li>Forms you fill out on our website or related platforms</li>
                  <li>Direct interactions (e.g., emails, messages, or inquiries)</li>
                  <li>Messages you send in our community Telegram channel</li>
                </ul>
                
                <p className="text-foreground leading-relaxed mb-3">
                  The types of information we collect may include:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-foreground">
                  <li>Your name, email address, and other contact details</li>
                  <li>General information about your interests, goals, preferences, employment status, wealth estimates, or any relevant details related to our services (e.g., newsletter preferences, coaching needs)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  2. How We Use Your Information
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  We use your information to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>Provide and improve our services</li>
                  <li>Support our marketing and communication efforts</li>
                  <li>Understand your needs to offer relevant recommendations and content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  3. Sharing Your Information
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  We do not sell your personal information. We may share your data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>Internally, within Weekly Wizdom</li>
                  <li>With trusted partners or service providers to support marketing, analytics, or customer engagement (e.g., Beehiiv, Whop, Google Analytics, etc.)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  4. Data Storage and Security
                </h2>
                <div className="bg-accent/50 border border-accent rounded-lg p-4">
                  <p className="text-foreground leading-relaxed">
                    Your information is stored with access controls and industry-standard security measures. Only authorized personnel can access your data, and we implement technical safeguards to prevent unauthorized access or misuse.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  5. Your Rights
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  Depending on your location, you may have rights under applicable data protection laws, such as:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>Access to your personal data</li>
                  <li>Correction of inaccurate information</li>
                  <li>Deletion of your data</li>
                  <li>Withdrawal of consent (where applicable)</li>
                </ul>
                <p className="text-foreground leading-relaxed mt-3">
                  To exercise your rights, please contact us using the information below.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  6. Cookies and Tracking
                </h2>
                <p className="text-foreground leading-relaxed">
                  We may use cookies or similar technologies to personalize your experience and analyze site usage. You can adjust your browser settings to control cookies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  7. Data Retention
                </h2>
                <p className="text-foreground leading-relaxed">
                  We retain your data only as long as necessary to fulfill the purposes described in this policy, or as required by law.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  8. Children's Privacy
                </h2>
                <p className="text-foreground leading-relaxed">
                  Our services are not intended for individuals under the age of 13. We do not knowingly collect data from minors.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  9. Contact Us
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  If you have any questions about this privacy policy or your data, contact us at:
                </p>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-foreground">
                    🌐 Website: <a href="https://weeklywizdom.com/#contact" className="text-primary hover:underline">https://weeklywizdom.com/#contact</a>
                  </p>
                  <p className="text-foreground mt-1">
                    📧 Email: <a href="mailto:support@weeklywizdom.com" className="text-primary hover:underline">support@weeklywizdom.com</a>
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  10. Updates to This Policy
                </h2>
                <p className="text-foreground leading-relaxed">
                  We may revise this privacy policy periodically. Please review it regularly to stay informed about how we protect your data.
                </p>
              </section>
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="pt-4">
              <div className="flex justify-center">
                <Link to="/terms">
                  <Button variant="outline" className="gap-2">
                    View Terms of Service
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;