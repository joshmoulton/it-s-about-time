import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Play, Star, Clock, ExternalLink } from 'lucide-react';
import { formatDuration } from '@/utils/formatDuration';
interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}
interface ModernEdgeWidgetProps {
  subscriber: Subscriber;
  hideHeader?: boolean;
}
export function ModernEdgeWidget({
  subscriber,
  hideHeader = false
}: ModernEdgeWidgetProps) {
  const navigate = useNavigate();

  // Countdown state for Wednesday 23:00 CEST/CET
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0
  });

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      // Get current time in Central European Time
      const now = new Date();
      const cetTime = new Date(now.toLocaleString("en-US", {
        timeZone: "Europe/Berlin"
      }));

      // Find next Wednesday at 23:00 CET/CEST
      let nextWednesday = new Date(cetTime);
      const dayOfWeek = nextWednesday.getDay();
      const daysUntilWednesday = dayOfWeek === 3 ? 0 : (3 - dayOfWeek + 7) % 7;
      nextWednesday.setDate(nextWednesday.getDate() + daysUntilWednesday);
      nextWednesday.setHours(23, 0, 0, 0);

      // If it's already past 23:00 on Wednesday, get next Wednesday
      if (dayOfWeek === 3 && cetTime.getHours() >= 23) {
        nextWednesday.setDate(nextWednesday.getDate() + 7);
      }

      const timeDiff = nextWednesday.getTime() - cetTime.getTime();
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

  // Fetch latest published videos
  const {
    data: latestVideos,
    isLoading
  } = useQuery({
    queryKey: ['latest-videos'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('video_tutorials').select('*').eq('status', 'published').order('created_at', {
        ascending: false
      }).limit(2);
      if (error) throw error;
      return data || [];
    }
  });
  const handleViewAllCourses = () => {
    console.log('🔄 Edge Widget: Navigating to videos...');
    navigate('/videos');
  };
  const handleWatchVideo = (video: any) => {
    if (video) {
      // Navigate to video or open in modal
      window.open(video.video_url, '_blank');
    }
  };
  return <ModernCard className="h-full flex flex-col bg-gradient-to-br from-teal-900/20 via-cyan-900/10 to-slate-800/50 border-slate-700/50 hover:border-slate-700/70 transition-all duration-200" interactive data-tour="edge-widget">
      {!hideHeader && <ModernCardHeader className="pb-2 pt-3 flex-shrink-0 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <ModernCardTitle className="text-sm text-white">Watch The Edge</ModernCardTitle>
              </div>
            </div>
            {/* Countdown Timer to match newsletter style */}
            <div className="bg-teal-900/30 rounded-lg border border-teal-500/20 px-3 py-1">
              <div className="text-center">
                <p className="text-teal-300 text-xs mb-1">Next In:</p>
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
        </ModernCardHeader>}
      
      <ModernCardContent className={`flex-1 flex flex-col ${hideHeader ? 'pt-0' : 'pt-0'} px-4 pb-4`}>
        <div className="flex-1 space-y-2 mb-3">
          {isLoading ? <div className="space-y-2">
              <div className="bg-teal-900/20 rounded-lg p-2.5 border border-teal-500/20">
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-teal-600/30 rounded w-3/4"></div>
                  <div className="h-3 bg-teal-600/30 rounded w-full"></div>
                </div>
              </div>
            </div> : latestVideos && latestVideos.length > 0 ? latestVideos.slice(0, 2).map((video, index) => <div key={video.id} className="bg-teal-900/20 rounded-lg p-2.5 cursor-pointer hover:bg-teal-800/30 transition-all duration-200 border border-teal-500/20" onClick={() => handleWatchVideo(video)}>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="default" className="text-xs bg-teal-500/20 text-teal-300 border-teal-500/30">
                      {index === 0 ? '🎬 Latest Video' : '📹 Video'}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm text-white line-clamp-1 leading-tight">
                    {video.title}
                  </h4>
                  {video.metadata && typeof video.metadata === 'object' && 'published_at' in video.metadata && video.metadata.published_at ? (
                    <div className="flex items-center gap-2 text-teal-200/60 text-xs">
                      <TrendingUp className="w-3 h-3" />
                      <span>{new Date(video.metadata.published_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-teal-200/60 text-xs">
                      <Play className="w-3 h-3" />
                      <span>Workshop #{video.title.match(/#(\d+)/)?.[1] || (index + 1)}</span>
                    </div>
                  )}
                </div>
              </div>) : <div className="bg-teal-900/20 rounded-lg p-2.5 border border-teal-500/20 text-center">
              <p className="text-xs text-teal-300/60">No videos available</p>
            </div>}
        </div>

        {/* Fixed position button */}
        <div className="mt-auto">
          <Button size="sm" className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl h-12 text-sm font-medium shadow-sm transition-all duration-200" onClick={handleViewAllCourses}>
            <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
            View All Edge Videos
          </Button>
        </div>
      </ModernCardContent>
    </ModernCard>;
}