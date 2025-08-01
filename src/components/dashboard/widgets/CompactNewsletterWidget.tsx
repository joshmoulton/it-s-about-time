
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Clock, ExternalLink, Sparkles } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface CompactNewsletterWidgetProps {
  subscriber: Subscriber;
}

export function CompactNewsletterWidget({
  subscriber
}: CompactNewsletterWidgetProps) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0
  });

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Convert current time to EST
      const estOffset = -5; // EST is UTC-5 (adjust to -4 for EDT during daylight saving)
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const est = new Date(utc + (estOffset * 3600000));
      
      // Find next Wednesday at 6:30 AM EST
      let nextWednesday = new Date(est);
      const currentDay = est.getDay(); // 0 = Sunday, 3 = Wednesday
      
      // Calculate days until next Wednesday
      let daysUntilWednesday;
      if (currentDay <= 3) {
        daysUntilWednesday = 3 - currentDay;
      } else {
        daysUntilWednesday = 7 - currentDay + 3;
      }
      
      // If it's Wednesday but past 6:30 AM, go to next Wednesday
      if (currentDay === 3 && (est.getHours() > 6 || (est.getHours() === 6 && est.getMinutes() >= 30))) {
        daysUntilWednesday = 7;
      }
      
      nextWednesday.setDate(est.getDate() + daysUntilWednesday);
      nextWednesday.setHours(6, 30, 0, 0);
      
      const timeDiff = nextWednesday.getTime() - est.getTime();
      
      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        return { days, hours, minutes };
      }
      
      return { days: 0, hours: 0, minutes: 0 };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every minute
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card data-tour="newsletter-widget" className="h-full flex flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200">
      <CardHeader className="pb-1 relative z-10">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-md">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              Newsletter
              <Sparkles className="h-3 w-3 text-yellow-500" />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 p-3 flex flex-col h-full">
        <div className="space-y-2 flex-1">
          {/* Countdown Timer - Smaller and more compact */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">
              Next Edition: Wed 6:30 AM EST
            </div>
            <div className="flex gap-2">
              {[{
                value: timeLeft.days,
                label: 'D',
                color: 'from-blue-500 to-blue-600'
              }, {
                value: timeLeft.hours,
                label: 'H',
                color: 'from-indigo-500 to-indigo-600'
              }, {
                value: timeLeft.minutes,
                label: 'M',
                color: 'from-purple-500 to-purple-600'
              }].map((item, index) => (
                <div key={item.label} className="text-center">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}>
                    <div className="text-sm font-bold text-white">{item.value}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Latest Newsletter Preview */}
          <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/20 flex-1 flex flex-col">
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <h4 className="font-medium text-sm mb-1 text-gray-900 dark:text-gray-100">
              Latest: Market Volatility Ahead
            </h4>
            <p className="text-xs text-muted-foreground mb-2 flex-1 line-clamp-2">
              Navigating earnings season strategies and key market indicators to watch...
            </p>
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-lg font-medium h-7 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Read Newsletter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
