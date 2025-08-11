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
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Effective Date: 24th of July 2025
              </p>
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
                  Weekly Wizdom LLC is a Michigan-based company that provides:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-foreground">
                  <li>A cross-asset financial newsletter</li>
                  <li>Monthly market reports</li>
                  <li>Educational commentary on trade setups</li>
                  <li>A private community chat</li>
                </ul>
                <p className="text-foreground leading-relaxed mt-3">
                  Our content is designed strictly for informational and educational purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  2. Eligibility
                </h2>
                <p className="text-foreground leading-relaxed">
                  Our services are intended for users 18 years and older. By using WeeklyWizdom.com, you confirm that you meet this requirement and are legally able to enter into this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  3. No Financial Advice (Important Disclaimer)
                </h2>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                  <ul className="list-disc pl-6 space-y-2 text-foreground">
                    <li>Weekly Wizdom LLC does not offer investment, legal, tax, or financial advice.</li>
                    <li>All content shared is for educational and informational purposes only. Our team may share opinions or personal investment actions; none of these should be construed as personalized investment recommendations or solicitations to buy or sell securities.</li>
                    <li>We are not registered financial advisors, broker-dealers, or fiduciaries under U.S. federal securities laws or any other jurisdiction. You agree that any actions you take based on our content are made solely at your own risk. Always consult a licensed financial professional before making decisions.</li>
                    <li>You acknowledge that trading or investing in financial markets carries inherent risks, including the potential for significant or total loss of capital.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  4. Payments and Refund Policy
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>All purchases are processed through Whop, which supports both traditional and cryptocurrency payments.</li>
                  <li>We do not offer refunds. In exceptional cases, we may grant refunds at our sole discretion. By subscribing, you agree to these terms.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  5. Intellectual Property
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>All content provided on WeeklyWizdom.com, including but not limited to newsletters, reports, graphics, videos, and written materials, is the intellectual property of Weekly Wizdom LLC and protected under U.S. and international copyright and intellectual property laws.</li>
                  <li>You may not reproduce, distribute, modify, or publicly display our content without our express written permission.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  6. Community and Communication
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>Participation in our private community (e.g., Telegram or similar platforms) is welcomed. However, you are solely responsible for any content you post.</li>
                  <li>We do not claim ownership of your posts, nor do we treat casual discussion as formal user-generated content. However, we reserve the right to moderate, remove, or report any content we deem abusive, unlawful, or in violation of community guidelines.</li>
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
                  <li>Weekly Wizdom LLC is not liable for any indirect, incidental, consequential, or punitive damages arising from your use of our services.</li>
                  <li>Our total liability, if any, is limited to the amount you paid us in the 12 months prior to the event giving rise to the claim.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  8. Termination
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>We may terminate or restrict access to our services at any time, with or without notice or cause.</li>
                  <li>You may cancel your subscription at any time through Whop. Refunds will not be issued except under Section 4 (Payments and Refund Policy).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  9. Privacy
                </h2>
                <p className="text-foreground leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  10. Governing Law
                </h2>
                <p className="text-foreground leading-relaxed">
                  These Terms are governed by the laws of the State of Michigan, without regard to conflict of law principles. You agree to the exclusive jurisdiction of the courts located in Michigan for any disputes related to these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  11. Updates to These Terms
                </h2>
                <p className="text-foreground leading-relaxed">
                  We may update these Terms from time to time. Changes will take effect immediately upon posting. You agree to review these Terms regularly.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  12. Contact
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  For any questions, contact us at:
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

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  13. Miscellaneous
                </h2>
                <p className="text-foreground leading-relaxed">
                  If any provision of these Terms is found to be unlawful, void, or unenforceable, it shall not affect the validity of the remaining provisions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  14. Entire Agreement
                </h2>
                <p className="text-foreground leading-relaxed">
                  These Terms, along with our Privacy Policy, represent the full agreement between you and Weekly Wizdom LLC and supersede all prior communications.
                </p>
              </section>
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Effective Date: July 24th, 2025
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;