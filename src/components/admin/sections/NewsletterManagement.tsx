
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Mail, Calendar, Users, Eye, RefreshCw, Clock, Edit, Trash2, ExternalLink } from 'lucide-react';
import { NewsletterCreation } from './NewsletterCreation';
import { useSyncNewsletters } from '@/hooks/useNewsletters';
import { useToast } from '@/hooks/use-toast';
import { safeFormatDate } from '@/utils/dateUtils';

export function NewsletterManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const syncNewsletters = useSyncNewsletters();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: newsletters, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ['newsletters'],
    queryFn: async () => {
      // Removed console.log to prevent PostHog rate limiting
      
      // Strategy 1: Try full query with safe fields
      try {
        // Removed console.log to prevent PostHog rate limiting
        const { data, error } = await supabase
          .from('newsletters')
          .select(`
            id,
            title,
            excerpt,
            status,
            published_at,
            scheduled_at,
            created_at,
            updated_at,
            web_url,
            read_time_minutes,
            view_count,
            required_tier
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          // Removed console.error to prevent PostHog rate limiting
          throw new Error(`Primary query failed: ${error.message}`);
        }
        
        // Removed console.log to prevent PostHog rate limiting
        return data || [];
      } catch (primaryError) {
        // Removed console.warn to prevent PostHog rate limiting
        
        // Strategy 2: Try minimal fields only
        try {
          // Removed console.log to prevent PostHog rate limiting
          const { data, error } = await supabase
            .from('newsletters')
            .select('id, title, status, created_at')
            .order('created_at', { ascending: false });
          
          if (error) {
            // Removed console.error to prevent PostHog rate limiting
            throw new Error(`Minimal query failed: ${error.message}`);
          }
          
          // Removed console.log to prevent PostHog rate limiting
          
          // Try to enrich with additional fields one by one
          const enrichedData = await Promise.all(
            (data || []).map(async (newsletter) => {
              try {
                const { data: enriched } = await supabase
                  .from('newsletters')
                  .select('excerpt, published_at, scheduled_at, updated_at, web_url, read_time_minutes, view_count, required_tier')
                  .eq('id', newsletter.id)
                  .single();
                
                return { ...newsletter, ...enriched };
              } catch (enrichError) {
                // Removed console.warn to prevent PostHog rate limiting
                return newsletter;
              }
            })
          );
          
          return enrichedData;
        } catch (minimalError) {
          // Removed console.warn to prevent PostHog rate limiting
          
          // Strategy 3: Try count-based approach to identify data issues
          try {
            console.log('📋 Attempting count query to diagnose issues...');
            const { count, error: countError } = await supabase
              .from('newsletters')
              .select('*', { count: 'exact', head: true });
            
            if (countError) {
              console.error('❌ Even count query failed:', countError);
              throw new Error(`Database connection issue: ${countError.message}`);
            }
            
            console.log(`📊 Found ${count} newsletters total, attempting batch fetch...`);
            
            // Try to fetch in small batches to isolate problematic records
            const batchSize = 10;
            const allNewsletters = [];
            
            for (let offset = 0; offset < (count || 0); offset += batchSize) {
              try {
                const { data: batch, error: batchError } = await supabase
                  .from('newsletters')
                  .select('id, title, status, created_at')
                  .order('created_at', { ascending: false })
                  .range(offset, offset + batchSize - 1);
                
                if (batchError) {
                  console.warn(`⚠️ Batch ${offset}-${offset + batchSize} failed:`, batchError);
                  continue;
                }
                
                allNewsletters.push(...(batch || []));
              } catch (batchError) {
                console.warn(`⚠️ Batch ${offset}-${offset + batchSize} threw error:`, batchError);
                continue;
              }
            }
            
            console.log('✅ Batch fetch completed:', allNewsletters.length, 'newsletters retrieved');
            return allNewsletters;
            
          } catch (finalError) {
            console.error('❌ All fallback strategies failed:', finalError);
            
            // Last resort: return empty array with detailed error info
            const errorDetails = {
              primaryError: primaryError.message,
              minimalError: minimalError.message,
              finalError: finalError.message,
              timestamp: new Date().toISOString()
            };
            
            console.error('💀 Complete failure details:', errorDetails);
            throw new Error(`All query strategies failed. Last error: ${finalError.message}`);
          }
        }
      }
    },
    retry: false, // Disable automatic retries since we handle fallbacks manually
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to avoid repeated failures
  });

  // Delete newsletter mutation
  const deleteNewsletterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      toast({
        title: 'Newsletter deleted',
        description: 'Newsletter has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete newsletter. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSyncNewsletters = () => {
    syncNewsletters.mutate();
  };

  const handleEditNewsletter = (newsletter: any) => {
    // For now, just show a toast - you can implement edit form later
    toast({
      title: 'Edit Newsletter',
      description: `Edit functionality for "${newsletter.title}" coming soon!`,
    });
  };

  const handlePreviewNewsletter = (newsletter: any) => {
    // Open newsletter in new tab if it has a web URL, otherwise show preview
    if (newsletter.web_url) {
      window.open(newsletter.web_url, '_blank');
    } else {
      toast({
        title: 'Preview',
        description: 'Preview functionality coming soon!',
      });
    }
  };

  const handleDeleteNewsletter = (newsletter: any) => {
    if (window.confirm(`Are you sure you want to delete "${newsletter.title}"? This action cannot be undone.`)) {
      deleteNewsletterMutation.mutate(newsletter.id);
    }
  };

  const filteredNewsletters = newsletters?.filter(newsletter =>
    newsletter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    newsletter.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'draft': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'scheduled': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (showCreateForm) {
    return <NewsletterCreation onCancel={() => setShowCreateForm(false)} />;
  }

  return (
    <div className="space-y-6 p-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Newsletter Management</h1>
          <p className="text-slate-400">Create and manage newsletter content</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSyncNewsletters}
            disabled={syncNewsletters.isPending}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncNewsletters.isPending ? 'animate-spin' : ''}`} />
            {syncNewsletters.isPending ? 'Syncing...' : 'Sync from BeehiIV'}
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Newsletter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Total Newsletters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{newsletters?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {newsletters?.filter(n => n.status === 'published').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {newsletters?.filter(n => n.status === 'draft').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {newsletters?.filter(n => n.status === 'scheduled').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Search Newsletters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search newsletters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Newsletters Table */}
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5 text-blue-400" />
            Newsletters ({filteredNewsletters.length})
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your newsletter content and delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queryError ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Error loading newsletters</h3>
              <p className="text-slate-400 mb-4">
                {queryError.message || 'Failed to load newsletters. Please try again.'}
              </p>
              <Button 
                onClick={() => refetch()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-slate-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredNewsletters.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No newsletters found</h3>
              <p className="text-slate-400 mb-4">
                {searchTerm ? 'No newsletters match your search.' : 'Get started by creating your first newsletter.'}
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Newsletter
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNewsletters.map((newsletter) => (
                <div key={newsletter.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-600/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{newsletter.title || 'Untitled Newsletter'}</h3>
                        <Badge className={getStatusColor(newsletter.status || 'draft')}>
                          {newsletter.status || 'draft'}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm mb-2">{newsletter.excerpt || 'No excerpt'}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {safeFormatDate(newsletter.created_at, 'MMM dd, yyyy', 'Unknown date')}
                        </div>
                        {newsletter.published_at && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Published {safeFormatDate(newsletter.published_at, 'MMM dd, yyyy HH:mm', 'Unknown date')}
                          </div>
                        )}
                        {newsletter.scheduled_at && newsletter.status === 'scheduled' && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Scheduled for {safeFormatDate(newsletter.scheduled_at, 'MMM dd, yyyy HH:mm', 'Unknown date')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-slate-300 border-slate-600 hover:bg-slate-600/50"
                        onClick={() => handleEditNewsletter(newsletter)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-slate-300 border-slate-600 hover:bg-slate-600/50"
                        onClick={() => handlePreviewNewsletter(newsletter)}
                      >
                        {newsletter.web_url ? <ExternalLink className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-300 border-red-600/50 hover:bg-red-600/10"
                        onClick={() => handleDeleteNewsletter(newsletter)}
                        disabled={deleteNewsletterMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
