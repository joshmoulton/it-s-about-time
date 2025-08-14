import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const premiumFeatures = [
  'Full Weekly Newsletter (No Previews)', 
  'Pro Recap & Education Emails', 
  'Exclusive Monthly Reports', 
  '24/7 Telegram Community Access', 
  'Real-Time Trade Alerts & Charts', 
  'Live Trading Workshops', 
  'Direct Access to Technical Analysts', 
  'VIP Notifications Dashboard (Never Miss a Move)'
];

export const PremiumFeatures: React.FC = () => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ email: '', question: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', contactForm);
    setContactForm({ email: '', question: '' });
    setShowContactForm(false);
    toast.success('Thank you! We will get back to you soon.');
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3 sm:p-4 lg:p-6">
      <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 text-center">Premium Features</h3>
      
      <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {premiumFeatures.map((feature, index) => (
          <div key={index} className="flex items-start gap-2 sm:gap-3">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
            </div>
            <span className="text-xs sm:text-sm leading-relaxed">{feature}</span>
          </div>
        ))}
      </div>
      
      {/* Contact Form */}
      <div className="pt-3 sm:pt-4 lg:pt-6 border-t">
        <p className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-center">Have questions?</p>
        {!showContactForm ? (
          <Button 
            onClick={() => setShowContactForm(true)}
            variant="outline" 
            size="sm"
            className="w-full h-8 sm:h-9 text-xs sm:text-sm"
          >
            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Contact Us
          </Button>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-2 sm:space-y-3">
            <input
              type="email"
              placeholder="Your email"
              value={contactForm.email}
              onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-input rounded bg-background"
              required
            />
            <textarea
              placeholder="Your question"
              value={contactForm.question}
              onChange={(e) => setContactForm(prev => ({ ...prev, question: e.target.value }))}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-input rounded bg-background resize-none"
              rows={3}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1 h-7 sm:h-8 text-xs">Send</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowContactForm(false)}
                className="flex-1 h-7 sm:h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};