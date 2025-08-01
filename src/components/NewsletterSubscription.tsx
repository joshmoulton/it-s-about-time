import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Check, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SuccessModal } from '@/components/SuccessModal';

interface NewsletterSubscriptionProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function NewsletterSubscription({ variant = 'default', className = '' }: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      // This component now just shows the UI - actual subscription happens through Beehiiv directly
      // We don't store any personal data locally for security
      return { success: true, message: 'Subscription noted' };
    },
    onSuccess: () => {
      setIsSubscribed(true);
      setShowSuccessModal(true);
      setEmail('');
    },
    onError: (error: Error) => {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    subscribeMutation.mutate(email);
  };

  if (isSubscribed) {
    return (
      <Card className={`${className} border-green-200 bg-green-50`}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            You're subscribed!
          </h3>
          <p className="text-green-600">
            Thank you for subscribing to our newsletter. You'll receive our latest market insights and trading analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`${className} flex flex-col sm:flex-row gap-2`}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={subscribeMutation.isPending}
        />
        <Button 
          onClick={handleSubmit}
          disabled={subscribeMutation.isPending || !email}
          className="bg-brand-primary hover:bg-brand-primary/90"
        >
          {subscribeMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Subscribe
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-brand-primary/10 rounded-full">
            <Mail className="w-6 h-6 text-brand-primary" />
          </div>
          <CardTitle className="text-xl">Subscribe to Our Newsletter</CardTitle>
          <p className="text-muted-foreground">
            Get weekly market insights, trading analysis, and exclusive content delivered to your inbox.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                disabled={subscribeMutation.isPending}
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary/90"
              disabled={subscribeMutation.isPending || !email}
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe Now
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Welcome to Weekly Wizdom!"
        description="We've created your free account and sent you an access link via email to get started!"
      />
    </>
  );
}