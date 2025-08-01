import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Eye, ExternalLink, RefreshCw, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useNewsletter, useIncrementNewsletterViews } from '@/hooks/useNewsletters';
import { NewsletterSubscription } from '@/components/NewsletterSubscription';
import { syncSpecificNewsletter } from '@/utils/testNewsletterSync';
import { useWhopAuth, useWhopAuthenticatedSync } from '@/hooks/useWhopAuth';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { FreemiumWidgetWrapper } from '@/components/freemium/FreemiumWidgetWrapper';
import { PaywallCard } from '@/components/PaywallCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function NewsletterReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: newsletter, isLoading, error, refetch } = useNewsletter(id!);
  const incrementViews = useIncrementNewsletterViews();
  const { isWhopAuthenticated, subscriptionTier, isLoading: whopLoading } = useWhopAuth();
  const { user: unifiedUser, isLoading: unifiedLoading } = useUnifiedAuth();
  const whopAuthenticatedSync = useWhopAuthenticatedSync();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (newsletter && id) {
      incrementViews.mutate(id);
    }
  }, [newsletter, id]);

  const handleSyncContent = async () => {
    if (!newsletter?.beehiiv_post_id) return;
    
    setIsSyncing(true);
    try {
      toast.info('Syncing newsletter content...');
      
      if (isWhopAuthenticated) {
        // Use Whop authenticated sync for potentially full content access
        console.log('🔐 Using Whop authenticated sync...');
        try {
          await whopAuthenticatedSync(newsletter.beehiiv_post_id);
          toast.success('Newsletter content synced with Whop authentication!');
        } catch (whopError) {
          console.warn('Whop sync failed, falling back to standard sync:', whopError);
          await syncSpecificNewsletter(newsletter.beehiiv_post_id);
          toast.success('Newsletter content synced (standard method)!');
        }
      } else {
        // Standard sync for non-Whop users
        console.log('📖 Using standard sync...');
        await syncSpecificNewsletter(newsletter.beehiiv_post_id);
        toast.success('Newsletter content synced successfully!');
      }
      
      await refetch();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync newsletter content');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-muted rounded w-20"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !newsletter) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/newsletters')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Newsletters
          </Button>
          
          {error?.message?.includes('No rows') ? (
            <PaywallCard
              requiredTier="paid"
              currentTier={unifiedUser?.subscription_tier || 'free'}
              title="Premium Content"
              excerpt="This newsletter requires a higher subscription tier to access."
              onUpgrade={() => {
                toast.info('Please upgrade your subscription to access this content');
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Newsletter not found</h2>
                <p className="text-muted-foreground">
                  The newsletter you're looking for doesn't exist or has been removed.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/newsletters')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Newsletters
        </Button>

        {/* Newsletter content */}
        <Card>
          <CardHeader>
            {/* Featured image */}
            {newsletter.featured_image_url && (
              <div className="w-full h-64 overflow-hidden rounded-lg mb-6">
                <img 
                  src={newsletter.featured_image_url} 
                  alt={newsletter.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title and metadata */}
            <div className="space-y-4">
              <CardTitle className="text-3xl font-bold leading-tight">
                {newsletter.title}
              </CardTitle>

              {newsletter.excerpt && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {newsletter.excerpt}
                </p>
              )}

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {newsletter.published_at ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(newsletter.published_at), 'MMMM dd, yyyy')}
                  </Badge>
                ) : newsletter.beehiiv_created_at ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(newsletter.beehiiv_created_at), 'MMMM dd, yyyy')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(newsletter.created_at), 'MMMM dd, yyyy')}
                  </Badge>
                )}
                
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {newsletter.read_time_minutes || 1} min read
                </Badge>

                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {newsletter.view_count} views
                </Badge>

                {newsletter.web_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={newsletter.web_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on BeehiIV
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Newsletter content with tier-based access control */}
            <FreemiumWidgetWrapper
              featureName={`the full content of "${newsletter.title}"`}
            >
              <div className="prose prose-lg max-w-none dark:prose-invert">
                {newsletter.html_content ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: newsletter.html_content }}
                    className="newsletter-content [&>*]:mb-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mt-8 [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-4 [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:ml-6 [&>ol]:mb-4 [&>li]:mb-2 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4 [&>img]:rounded-lg [&>img]:my-6 [&>img]:w-full [&>img]:h-auto [&>a]:text-primary [&>a]:underline [&>a]:hover:text-primary/80 [&>table]:w-full [&>table]:border-collapse [&>th]:border [&>th]:p-2 [&>th]:bg-muted [&>td]:border [&>td]:p-2"
                  />
                ) : newsletter.plain_content ? (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {newsletter.plain_content}
                  </div>
                ) : newsletter.content ? (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {newsletter.content}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-lg font-medium mb-2">Content Preview Not Available</h3>
                      <p className="mb-6">
                        The newsletter content is not yet synced. Try syncing it from BeehiIV or view it directly on their platform.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={handleSyncContent}
                          disabled={isSyncing}
                          className="inline-flex items-center gap-2"
                          variant="default"
                        >
                          {isWhopAuthenticated ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                          )}
                          {isSyncing ? 'Syncing...' : isWhopAuthenticated ? 'Sync with Whop Auth' : 'Sync Content'}
                        </Button>
                        {isWhopAuthenticated && (
                          <Badge variant="secondary" className="self-center">
                            🔐 Whop Authenticated ({subscriptionTier})
                          </Badge>
                        )}
                        {newsletter.web_url && (
                          <Button
                            variant="outline"
                            asChild
                            className="inline-flex items-center gap-2"
                          >
                            <a 
                              href={newsletter.web_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View on BeehiIV
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FreemiumWidgetWrapper>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}