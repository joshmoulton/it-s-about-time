
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Play, Lock, Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface EdgeWidgetProps {
  subscriber: Subscriber;
}

const mockVideoTutorials = [
  {
    id: 1,
    title: "Options Trading Basics",
    description: "Learn the fundamentals of options trading with real market examples and practical strategies.",
    duration: "28:45",
    topic: "Options Trading",
    published_date: "2024-06-10",
    thumbnail: "/placeholder.svg",
    tier: "paid"
  },
  {
    id: 2,
    title: "Technical Analysis Deep Dive",
    description: "Master advanced charting techniques and technical indicators used by professional traders.",
    duration: "45:20",
    topic: "Technical Analysis",
    published_date: "2024-06-05",
    thumbnail: "/placeholder.svg",
    tier: "paid"
  },
  {
    id: 3,
    title: "Trading Psychology Masterclass",
    description: "Understand the mental game of trading and develop the mindset of successful traders.",
    duration: "35:15",
    topic: "Psychology",
    published_date: "2024-05-28",
    thumbnail: "/placeholder.svg",
    tier: "premium"
  },
  {
    id: 4,
    title: "Risk Management Essentials",
    description: "Learn professional risk management techniques to protect and grow your trading capital.",
    duration: "22:30",
    topic: "Risk Management",
    published_date: "2024-05-20",
    thumbnail: "/placeholder.svg",
    tier: "paid"
  },
  {
    id: 5,
    title: "Market Analysis Framework",
    description: "Step-by-step guide to analyzing markets like a professional trader.",
    duration: "38:10",
    topic: "Market Analysis",
    published_date: "2024-06-01",
    thumbnail: "/placeholder.svg",
    tier: "premium"
  }
];

export function EdgeWidget({ subscriber }: EdgeWidgetProps) {
  const navigate = useNavigate();

  const getTierLevel = (tier: string) => {
    const levels = { free: 0, paid: 1, premium: 2 };
    return levels[tier as keyof typeof levels] || 0;
  };

  const userTierLevel = getTierLevel(subscriber?.subscription_tier || 'free');

  const canAccess = (requiredTier: string) => {
    return userTierLevel >= getTierLevel(requiredTier);
  };

  const getTopicColor = (topic: string) => {
    const colors = {
      'Options Trading': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'Technical Analysis': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'Psychology': 'bg-green-500/10 text-green-600 border-green-500/20',
      'Risk Management': 'bg-red-500/10 text-red-600 border-red-500/20',
      'Market Analysis': 'bg-orange-500/10 text-orange-600 border-orange-500/20'
    };
    return colors[topic as keyof typeof colors] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (userTierLevel < 1) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            The Edge
          </h1>
          <p className="text-muted-foreground mt-2">
            Recorded video tutorials and trading insights
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upgrade Required</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Access premium video tutorials, trading insights, and educational content with a paid subscription.
            </p>
            <Button onClick={() => navigate('/pricing')}>
              Upgrade to Paid
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          The Edge
        </h1>
        <p className="text-muted-foreground mt-2">
          Recorded video tutorials and trading insights
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Welcome to The Edge</CardTitle>
          <CardDescription>
            Your library of professional trading video tutorials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">25+</div>
              <div className="text-sm text-muted-foreground">Video Tutorials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">12+</div>
              <div className="text-sm text-muted-foreground">Hours of Content</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Weekly</div>
              <div className="text-sm text-muted-foreground">New Videos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Latest Video Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockVideoTutorials.map((video) => {
            const hasAccess = canAccess(video.tier);
            return (
              <Card key={video.id} className={`relative overflow-hidden ${!hasAccess ? 'opacity-60' : ''}`}>
                <div className="relative">
                  <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                    {hasAccess ? (
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Play className="h-6 w-6 text-white ml-1" fill="currentColor" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-muted-foreground/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                      {video.duration}
                    </div>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">
                      {video.title}
                      {!hasAccess && <Lock className="inline h-4 w-4 text-yellow-500 ml-2" />}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getTopicColor(video.topic)}>
                      {video.topic}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(video.published_date)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4 line-clamp-2">
                    {video.description}
                  </CardDescription>
                  <Button 
                    className="w-full" 
                    disabled={!hasAccess}
                    variant={hasAccess ? "default" : "outline"}
                  >
                    {hasAccess ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Watch Tutorial
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Requires {video.tier} subscription
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
