
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Play, Star, Clock, Zap } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface CompactEdgeWidgetProps {
  subscriber: Subscriber;
}

export function CompactEdgeWidget({ subscriber }: CompactEdgeWidgetProps) {
  return (
    <Card className="h-full flex flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200" data-tour="edge-widget">
      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg text-white shadow-md">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              Watch The Edge
              <Zap className="h-3 w-3 text-teal-600" />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 p-4 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {/* Featured Content */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/20 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                  Options Trading Fundamentals
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Master the basics with practical examples and real-world strategies
                </p>
              </div>
              <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs ml-2 flex-shrink-0">
                New
              </Badge>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>28:45</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Published today</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>4.8</span>
              </div>
            </div>
            
            {/* Action Button */}
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-lg font-medium h-9 mt-auto"
            >
              <Play className="h-4 w-4 mr-2" />
              Watch Latest Edge
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
