
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar, Eye, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useNewsletters, useSyncNewsletters, useAutoSyncNewsletters } from '@/hooks/useNewsletters';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';

export function NewslettersView() {
  const navigate = useNavigate();
  const { data: newsletters, isLoading, refetch } = useNewsletters();
  const syncNewsletters = useSyncNewsletters();
  const { user } = useUnifiedAuth();
  const { isAdmin } = useAdminCheck();
  
  // Enable auto-sync for newsletters
  useAutoSyncNewsletters();

  const handleRefresh = () => {
    refetch();
  };

  const handleSync = () => {
    syncNewsletters.mutate();
  };

  const handleViewAll = () => {
    navigate('/newsletters');
  };

  const handleReadNewsletter = (newsletterId: string) => {
    navigate(`/newsletter/${newsletterId}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Newsletters</h1>
          <p className="text-muted-foreground">Weekly market insights and analysis</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              disabled={syncNewsletters.isPending}
            >
              <Mail className={`h-4 w-4 mr-2 ${syncNewsletters.isPending ? 'animate-pulse' : ''}`} />
              Sync from beehiiv
            </Button>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : newsletters && newsletters.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsletters.slice(0, 6).map((newsletter) => (
              <Card key={newsletter.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleReadNewsletter(newsletter.id)}>
                {newsletter.featured_image_url && (
                  <div className="w-full h-32 overflow-hidden rounded-t-lg">
                    <img 
                      src={newsletter.featured_image_url} 
                      alt={newsletter.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-brand-primary transition-colors">{newsletter.title}</CardTitle>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge 
                        variant={newsletter.metadata?.content_type === 'newsletter' ? 'default' : 'secondary'}
                        className={`text-xs ${
                          newsletter.metadata?.content_type === 'newsletter' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        {newsletter.metadata?.content_type === 'newsletter' ? '📧 Newsletter' : '📄 Article'}
                      </Badge>
                      {newsletter.required_tier !== 'free' && (
                        <Badge variant={newsletter.required_tier === 'premium' ? 'default' : 'secondary'} className="text-xs">
                          {newsletter.required_tier === 'premium' ? '👑' : '⚡'} {newsletter.required_tier}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {newsletter.published_at ? format(new Date(newsletter.published_at), 'MMM dd') : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                  {newsletter.excerpt && (
                    <CardDescription className="line-clamp-2">
                      {newsletter.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {newsletter.read_time_minutes} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {newsletter.view_count}
                      </div>
                    </div>
                    <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Read Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {newsletters.length > 6 && (
            <div className="text-center">
              <Button onClick={handleViewAll}>
                View All Newsletters ({newsletters.length})
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-4">No newsletters available yet.</p>
          {isAdmin && (
            <Button onClick={handleSync} disabled={syncNewsletters.isPending}>
              <Mail className="h-4 w-4 mr-2" />
              Sync from beehiiv
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
