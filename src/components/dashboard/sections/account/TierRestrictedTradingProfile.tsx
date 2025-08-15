import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, TrendingUp } from 'lucide-react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { TierUpgradePrompt } from '@/components/dashboard/widgets/TierUpgradePrompt';
import { UpgradeModal } from '@/components/freemium/UpgradeModal';
import { ClientSideTradingProfile } from './ClientSideTradingProfile';
import { useState } from 'react';

export function TierRestrictedTradingProfile() {
  const { currentUser } = useEnhancedAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if user has premium access
  const isPremiumUser = currentUser?.subscription_tier === 'premium' || currentUser?.subscription_tier === 'paid';

  if (!currentUser) {
    return (
      <Card className="border shadow-lg">
        <CardHeader>
          <CardTitle>Trading Profile</CardTitle>
          <CardDescription>Sign in to access your trading profile</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If user is free tier, show upgrade prompt
  if (!isPremiumUser) {
    return (
      <div className="space-y-6">
        <Card className="border border-brand-navy/20 bg-brand-navy/5 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trading Profile
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Complete trading questionnaire and manage your trading preferences (Premium Feature)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Premium Trading Features</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Unlock comprehensive trading questionnaire, personalized recommendations, 
                and advanced trading profile management with premium access.
              </p>
              
              <div className="space-y-3 text-sm text-muted-foreground mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Comprehensive Trading Questionnaire</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Personalized Trading Recommendations</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Risk Management Profile</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Market Preference Settings</span>
                </div>
              </div>

              <Button onClick={() => setShowUpgradeModal(true)} size="lg">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Access Trading Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Prompt Widget */}
        <TierUpgradePrompt 
          subscriber={{ subscription_tier: currentUser?.subscription_tier || 'free' }}
          feature="trading profile and questionnaire"
        />

        {/* Upgrade Modal */}
        <UpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName="trading profile"
        />
      </div>
    );
  }

  // Premium user - show full trading profile
  return <ClientSideTradingProfile />;
}