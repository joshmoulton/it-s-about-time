import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Mail, ExternalLink, Sparkles, Calendar, Clock } from 'lucide-react';
import { useNewsletters } from '@/hooks/useNewsletters';
import { format } from 'date-fns';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface ModernNewsletterWidgetProps {
  subscriber: Subscriber;
  hideHeader?: boolean;
}

export function ModernNewsletterWidget({
  subscriber,
  hideHeader = false
}: ModernNewsletterWidgetProps) {
  const navigate = useNavigate();
  const {
    data: newsletters,
    isLoading
  } = useNewsletters(10); // Get more items to separate by type

  // Get the latest 2 newsletters (similar to how videos shows 2)
  const latestNewsletters = newsletters?.filter(item => item.metadata?.content_type === 'newsletter').slice(0, 2) || [];

  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0
  });

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      // Get current time in EST/EDT
      const now = new Date();
      const estTime = new Date(now.toLocaleString("en-US", {
        timeZone: "America/New_York"
      }));

      // Find next Wednesday at 6:30 AM EST
      let nextWednesday = new Date(estTime);
      const dayOfWeek = nextWednesday.getDay();
      const daysUntilWednesday = dayOfWeek === 3 ? 0 : (3 - dayOfWeek + 7) % 7;
      nextWednesday.setDate(nextWednesday.getDate() + daysUntilWednesday);
      nextWednesday.setHours(6, 30, 0, 0);

      // If it's already past 6:30 AM on Wednesday, get next Wednesday
      if (dayOfWeek === 3 && estTime.getHours() >= 6 && estTime.getMinutes() >= 30) {
        nextWednesday.setDate(nextWednesday.getDate() + 7);
      }
      
      const timeDiff = nextWednesday.getTime() - estTime.getTime();
      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({
          days,
          hours,
          minutes
        });
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleViewAllNewsletters = () => {
    navigate('/newsletters');
  };

  const handleOpenNewsletter = (newsletter: any) => {
    if (newsletter) {
      const slug = newsletter.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
      window.open(`https://newsletter.weeklywizdom.com/p/${slug}`, '_blank');
    }
  };

  return (
    <ModernCard className="h-full flex flex-col bg-gradient-to-br from-blue-900/20 via-indigo-900/10 to-slate-800/50 border-slate-700/50 hover:border-slate-700/70 transition-all duration-200" interactive data-tour="newsletter-widget">
      {!hideHeader && (
        <ModernCardHeader className="pb-2 pt-3 flex-shrink-0 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <div>
                <ModernCardTitle className="text-sm text-white">Read the Newsletter</ModernCardTitle>
              </div>
            </div>
            {/* Countdown Timer to match edge style */}
            <div className="bg-blue-900/30 rounded-lg border border-blue-500/20 px-3 py-1">
              <div className="text-center">
                <p className="text-blue-300 text-xs mb-1">Next In:</p>
                <div className="flex justify-center gap-1 text-white font-mono text-xs">
                  <span>{timeLeft.days}d</span>
                  <span>:</span>
                  <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
                  <span>:</span>
                  <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
                </div>
              </div>
            </div>
          </div>
        </ModernCardHeader>
      )}
      
      <ModernCardContent className={`flex-1 flex flex-col ${hideHeader ? 'pt-0' : 'pt-0'} px-4 pb-4`}>
        <div className="flex-1 space-y-2 mb-3">
          {isLoading ? (
            <div className="space-y-2">
              <div className="bg-blue-900/20 rounded-lg p-2.5 border border-blue-500/20">
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-blue-600/30 rounded w-3/4"></div>
                  <div className="h-3 bg-blue-600/30 rounded w-full"></div>
                </div>
              </div>
            </div>
          ) : latestNewsletters && latestNewsletters.length > 0 ? 
            latestNewsletters.slice(0, 2).map((newsletter, index) => (
              <div 
                key={newsletter.id} 
                className="bg-blue-900/20 rounded-lg p-2.5 cursor-pointer hover:bg-blue-800/30 transition-all duration-200 border border-blue-500/20" 
                onClick={() => handleOpenNewsletter(newsletter)}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="default" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {index === 0 ? '📧 Latest Newsletter' : '📰 Newsletter'}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm text-white line-clamp-1 leading-tight">
                    {newsletter.title}
                  </h4>
                  {newsletter.published_at ? (
                    <div className="flex items-center gap-2 text-blue-200/60 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(newsletter.published_at), 'MMM dd')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-blue-200/60 text-xs">
                      <Mail className="w-3 h-3" />
                      <span>Newsletter</span>
                    </div>
                  )}
                </div>
              </div>
            )) 
          : (
            <div className="bg-blue-900/20 rounded-lg p-2.5 border border-blue-500/20 text-center">
              <Sparkles className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
              <p className="text-xs text-blue-300/60">Next issue coming soon!</p>
            </div>
          )}
        </div>

        {/* Fixed position button */}
        <div className="mt-auto">
          <Button 
            size="sm" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-12 text-sm font-medium shadow-sm transition-all duration-200" 
            onClick={handleViewAllNewsletters}
          >
            <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
            View All Newsletters
          </Button>
        </div>
      </ModernCardContent>
    </ModernCard>
  );
}