
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Target, Sparkles } from 'lucide-react';
import { ModernSignalForm } from './signal-generator/ModernSignalForm';

export function SignalGenerator() {
  return (
    <div className="h-full w-full bg-background flex flex-col">
      {/* Simplified Header */}
      <div className="px-6 py-4 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trading Signal Generator</h1>
            <p className="text-sm text-muted-foreground">Create professional trading signals</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-hidden">
        <ModernSignalForm />
      </div>
    </div>
  );
}
