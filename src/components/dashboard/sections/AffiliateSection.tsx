
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Link, TrendingUp } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface AffiliateSectionProps {
  subscriber: Subscriber;
}

export function AffiliateSection({ subscriber }: AffiliateSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Affiliate Program</h1>
        <p className="text-muted-foreground">Earn commissions by referring new members</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Referrals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">$0</div>
                  <div className="text-sm text-muted-foreground">Earnings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">0%</div>
                  <div className="text-sm text-muted-foreground">Conversion</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Your Referral Link
              </CardTitle>
              <CardDescription>
                Share this link to earn 30% commission on every signup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value="https://weeklywizddom.com/ref/abc123" 
                  readOnly 
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                />
                <Button>Copy Link</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Commission Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">30%</div>
                <p className="text-sm text-muted-foreground">
                  Per successful referral
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Program Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <Badge className="bg-green-500/10 text-green-600">
                  Active
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Your affiliate account is active and ready to earn
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
