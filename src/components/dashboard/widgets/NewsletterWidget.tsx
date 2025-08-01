import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, ExternalLink, Calendar } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface NewsletterWidgetProps {
  subscriber: Subscriber;
}

export function NewsletterWidget({ subscriber }: NewsletterWidgetProps) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 3,
    hours: 14,
    minutes: 32,
    seconds: 45
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const mockNewsletters = [
    {
      id: 1,
      title: "Market Volatility Ahead: Navigating Earnings Season",
      excerpt: "As we head into the busiest earnings week of the quarter, here's what you need to know about positioning your portfolio...",
      date: "December 10, 2024",
      readTime: "8 min read",
      isLatest: true
    },
    {
      id: 2,
      title: "Fed Decision Impact: Rate Cut Expectations",
      excerpt: "The Federal Reserve's upcoming decision could significantly impact market direction. Our analysis of the most likely scenarios...",
      date: "December 3, 2024",
      readTime: "6 min read",
      isLatest: false
    },
    {
      id: 3,
      title: "Tech Sector Rotation: Where Smart Money is Moving",
      excerpt: "Institutional investors are making significant moves in the tech sector. Here's where they're allocating capital...",
      date: "November 26, 2024",
      readTime: "7 min read",
      isLatest: false
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Newsletter
        </h1>
        <p className="text-muted-foreground mt-2">
          Weekly market insights and analysis
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Next Newsletter In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{timeLeft.days}</div>
              <div className="text-sm text-muted-foreground">Days</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{timeLeft.hours}</div>
              <div className="text-sm text-muted-foreground">Hours</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{timeLeft.minutes}</div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{timeLeft.seconds}</div>
              <div className="text-sm text-muted-foreground">Seconds</div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Next edition: Sunday, December 17th at 6 AM EST
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Newsletters</h2>
        {mockNewsletters.map((newsletter) => (
          <Card key={newsletter.id} className={newsletter.isLatest ? 'border-primary/40' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{newsletter.title}</CardTitle>
                    {newsletter.isLatest && (
                      <Badge className="bg-primary/10 text-primary">Latest</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {newsletter.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {newsletter.readTime}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Read
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {newsletter.excerpt}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Newsletter Archive</CardTitle>
          <CardDescription>
            Access all previous newsletters and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Browse our complete archive of market analysis and insights
            </p>
            <Button variant="outline">
              View All Newsletters
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
