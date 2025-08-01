import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService = () => {
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
                Terms of Service
              </h1>
              <p className="text-muted-foreground mt-1">
                Weekly Wizdom Terms of Service
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
                Welcome to WeeklyWizdom.com ("we," "us," or "our"). These Terms of Service ("Terms") govern your use of our website, services, newsletters, and community content. By accessing or using any part of WeeklyWizdom.com, you agree to these Terms. If you do not agree, please do not use our services.
              </p>
            </div>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  1. Who We Are
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  WeeklyWizdom is a U.S.-based company that provides:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-foreground">
                  <li>A cross-asset financial newsletter</li>
                  <li>Monthly market reports</li>
                  <li>Educational commentary on trade setups</li>
                  <li>A private community chat</li>
                </ul>
                <p className="text-foreground leading-relaxed mt-3">
                  Our content is designed for informational and educational purposes only.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  2. Eligibility
                </h2>
                <p className="text-foreground leading-relaxed">
                  Our services are intended for users 13 years and older. By using WeeklyWizdom, you confirm that you meet this requirement and are legally able to enter into this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  3. No Financial Advice (Important Disclaimer)
                </h2>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                  <ul className="list-disc pl-6 space-y-2 text-foreground">
                    <li>WeeklyWizdom does not offer investment, legal, tax, or financial advice.</li>
                    <li>All content shared is for educational and informational purposes only. Our analysts may share personal opinions or investment decisions they make, these opinions and decisions should not be construed as personalized investment recommendations or a solicitation to buy or sell any securities.</li>
                    <li>We are not registered financial advisors, broker-dealers, or fiduciaries under U.S. federal securities laws or any other jurisdiction. Decisions based on our materials are made at your own risk. Always consult a licensed professional before making any financial decisions.</li>
                    <li>You acknowledge that trading or investing in financial markets carries inherent risks, including the loss of capital.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  4. Payments and Refund Policy
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>All purchases are made through Whop, which supports both traditional payment methods and cryptocurrency.</li>
                  <li>We do not offer refunds. Exceptions may be made at our sole discretion, on a case-by-case basis.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  5. Intellectual Property
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>All content on WeeklyWizdom.com, including newsletters, reports, graphics, and written materials, is the intellectual property of WeeklyWizdom and is protected by copyright and other applicable laws.</li>
                  <li>You may not reproduce, distribute, modify, or publicly display our content without express written permission.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  6. Community and Communication
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>While you may participate in our community chat, any posts, comments, or messages within the community remain your responsibility. We do not claim ownership over your messages and do not consider casual discussion in our private groups as formal user-generated content for the purpose of these Terms.</li>
                  <li>However, we reserve the right to moderate or remove content that we deem abusive, unlawful, or disruptive.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  7. Limitation of Liability
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  To the fullest extent permitted by law:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>We are not liable for any indirect, incidental, or consequential damages arising from your use of our services.</li>
                  <li>Our total liability, if any, is limited to the amount you paid us in the 12 months preceding the event giving rise to the claim.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  8. Termination
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>We reserve the right to terminate or restrict access to our services at any time, with or without cause, and without notice.</li>
                  <li>You may cancel your subscription via Whop at any time. No refunds will be issued upon cancellation, unless otherwise granted per Section 4.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  9. Privacy
                </h2>
                <p className="text-foreground leading-relaxed">
                  Your privacy is important to us. Please review our{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  for details on how we collect and use personal data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  10. Governing Law
                </h2>
                <p className="text-foreground leading-relaxed">
                  These Terms are governed by the laws of the [U.S. state where WeeklyWizdom is registered]. You agree to submit to the exclusive jurisdiction of the courts located in that state for any disputes arising from these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  11. Updates to These Terms
                </h2>
                <p className="text-foreground leading-relaxed">
                  We may update these Terms at any time. Changes take effect immediately upon posting. We encourage you to review this page periodically.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  12. Contact
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  If you have questions about these Terms, please contact us at:
                </p>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-foreground">
                    📧 Email: <a href="mailto:support@weeklywizdom.com" className="text-primary hover:underline">support@weeklywizdom.com</a>
                  </p>
                  <p className="text-foreground mt-1">
                    🌐 Website: <a href="https://weeklywizdom.com/#contact" className="text-primary hover:underline">https://weeklywizdom.com/#contact</a>
                  </p>
                </div>
              </section>
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;