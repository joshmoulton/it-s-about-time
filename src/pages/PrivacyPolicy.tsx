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
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Effective Date: 24th of July 2025
              </p>
              <p className="text-foreground leading-relaxed">
                Weekly Wizdom LLC ("we," "our," or "us") values your privacy and is committed to protecting your personal data. This policy explains how we collect, use, share, and protect your information.
              </p>
            </div>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  1. Information We Collect
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  We may collect personal information when you:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-foreground mb-4">
                  <li>Fill out forms on our website or external platforms</li>
                  <li>Contact us via email or social media</li>
                  <li>Send messages in our community chat (e.g., Telegram)</li>
                </ul>
                
                <p className="text-foreground leading-relaxed mb-3">
                  We may collect:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-foreground">
                  <li>Your name, email, and contact details</li>
                  <li>General info about your interests, employment, wealth range, or goals related to our services</li>
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
                  <li>Tailor communications and marketing</li>
                  <li>Respond to inquiries and deliver relevant content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  3. Legal Basis for Processing (EU/UK Users)
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  For users in the EU/UK, we process your personal data under one or more of the following bases:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>Your consent</li>
                  <li>To perform a contract with you</li>
                  <li>Our legitimate business interests</li>
                  <li>Compliance with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  4. Sharing Your Information
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  We do not sell your personal data. We may share data with:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>Internal staff and service providers (e.g., Beehiiv, Whop, Google Analytics)</li>
                  <li>External tools used to support communications, payments, or marketing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  5. Data Storage and Security
                </h2>
                <p className="text-foreground leading-relaxed">
                  We store your information securely with access controls and encryption. Only authorized personnel can access your data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  6. International Data Transfers
                </h2>
                <p className="text-foreground leading-relaxed">
                  Your data may be processed or stored outside your country of residence, including in the United States. We use standard safeguards to protect your information during such transfers.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  7. Your Rights
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  Depending on your location (e.g., EU, UK, California), you may have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>Access your data</li>
                  <li>Correct or delete your data</li>
                  <li>Withdraw consent</li>
                  <li>Object to data use</li>
                  <li>Request portability of your data</li>
                  <li>Opt out of the sale or sharing of your data (California)</li>
                  <li>File a complaint with a data protection authority</li>
                </ul>
                <p className="text-foreground leading-relaxed mt-3">
                  To exercise your rights, contact us at support@weeklywizdom.com.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  8. Cookies and Tracking
                </h2>
                <p className="text-foreground leading-relaxed">
                  We may use cookies and similar technologies to personalize content and measure engagement. You can adjust your browser settings to disable cookies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  9. Data Retention
                </h2>
                <p className="text-foreground leading-relaxed">
                  We retain data only as long as needed for business or legal reasons. When no longer needed, we securely delete or anonymize it.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  10. Children's Privacy
                </h2>
                <p className="text-foreground leading-relaxed">
                  Our services are not directed at children under 18. We do not knowingly collect data from anyone under 18.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3 border-b border-border pb-2">
                  11. Contact Us
                </h2>
                <p className="text-foreground leading-relaxed mb-3">
                  For privacy-related questions or requests, contact us at:
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
                  12. Updates to This Policy
                </h2>
                <p className="text-foreground leading-relaxed">
                  We may update this policy periodically. Changes will be posted on this page with an updated effective date. We encourage you to check it regularly.
                </p>
              </section>
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Effective Date: July 24th, 2025
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