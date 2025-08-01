
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Users, Mail, Eye, CreditCard } from 'lucide-react';
import { useOptimizedAdminStats } from '@/hooks/useOptimizedAdminStats';

export function EnhancedConversionFunnel() {
  const { data: stats } = useOptimizedAdminStats();

  // Calculate funnel data based on real stats
  const totalUsers = stats?.totalUsers || 0;
  const freeUsers = stats?.usersByTier?.free || 0;
  const paidUsers = stats?.usersByTier?.paid || 0;
  const premiumUsers = stats?.usersByTier?.premium || 0;

  // Mock visitor data (would come from analytics in real app)
  const visitors = Math.max(totalUsers * 4, 1000); // Assume 4x visitors to users ratio
  const signups = totalUsers;
  const engaged = Math.floor(signups * 0.75); // 75% engagement rate
  const converted = paidUsers + premiumUsers;

  const funnelSteps = [
    {
      name: 'Visitors',
      value: visitors,
      icon: Users,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-500/10',
      percentage: 100
    },
    {
      name: 'Signups',
      value: signups,
      icon: Mail,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-500/10',
      percentage: visitors > 0 ? (signups / visitors) * 100 : 0
    },
    {
      name: 'Engaged Users',
      value: engaged,
      icon: Eye,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-500/10',
      percentage: signups > 0 ? (engaged / signups) * 100 : 0
    },
    {
      name: 'Paid Conversions',
      value: converted,
      icon: CreditCard,
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-500/10',
      percentage: engaged > 0 ? (converted / engaged) * 100 : 0
    }
  ];

  return (
    <Card className="border border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingDown className="h-5 w-5 text-blue-400" />
          Conversion Funnel
        </CardTitle>
        <CardDescription className="text-slate-400">
          User journey from visitor to paid subscriber
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funnel Visualization */}
        <div className="relative">
          {funnelSteps.map((step, index) => {
            const Icon = step.icon;
            const width = Math.max((step.percentage / 100) * 100, 20); // Minimum 20% width for visibility
            const isLast = index === funnelSteps.length - 1;
            
            return (
              <div key={step.name} className="relative mb-4">
                {/* Funnel Step */}
                <div className="flex items-center gap-4 mb-2">
                  <div className={`p-2 rounded-lg ${step.bgColor}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{step.name}</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">{step.value.toLocaleString()}</span>
                        {index > 0 && (
                          <span className="text-xs text-slate-400 ml-2">
                            {step.percentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${step.color} transition-all duration-700 ease-out rounded-full`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {!isLast && (
                  <div className="flex justify-center mb-2">
                    <div className="w-px h-4 bg-slate-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Conversion Rates Grid */}
        <div className="border-t border-slate-700 pt-4">
          <div className="text-sm font-medium text-white mb-3">Conversion Rates</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Visitor → Signup:</span>
              <span className="font-medium text-white">
                {visitors > 0 ? ((signups / visitors) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Signup → Engagement:</span>
              <span className="font-medium text-white">
                {signups > 0 ? ((engaged / signups) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Engagement → Paid:</span>
              <span className="font-medium text-white">
                {engaged > 0 ? ((converted / engaged) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Overall Conversion:</span>
              <span className="font-medium text-white">
                {visitors > 0 ? ((converted / visitors) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
