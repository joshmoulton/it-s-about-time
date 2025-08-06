import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewsletters, useSyncNewsletters } from '@/hooks/useNewsletters';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Eye, RefreshCw, Mail, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Newsletters() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'newest' | 'oldest' | 'title'>('newest');
  const { data: newsletters, isLoading, refetch } = useNewsletters(undefined, sortBy);
  const syncNewsletters = useSyncNewsletters();
  const { isAdmin } = useAdminCheck();

  const filteredNewsletters = React.useMemo(() => {
    if (!newsletters) return [];
    if (!searchTerm) return newsletters;
    
    return newsletters.filter(newsletter =>
      newsletter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (newsletter.excerpt && newsletter.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [newsletters, searchTerm]);

  const getDisplayDate = (newsletter: any) => {
    // Try to get the most relevant date in order of preference
    // Don't use updated_at as it represents when the record was modified, not when published
    const dateString = newsletter.published_at || 
                      newsletter.beehiiv_created_at || 
                      newsletter.created_at;
    
    if (!dateString) {
      // If no dates available, use a placeholder that indicates unknown date
      // Don't use updated_at as fallback since it's misleading
      return new Date('2024-01-01');
    }
    
    const date = new Date(dateString);
    // Check if date is valid (not epoch date)
    if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
      return new Date('2024-01-01');
    }
    
    return date;
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSyncClick = () => {
    syncNewsletters.mutate();
    toast.success('Newsletter sync started - refreshing data from Beehiiv');
  };

  const handleRefreshData = () => {
    console.log('🔄 Triggering newsletter refresh...');
    syncNewsletters.mutate();
    toast.success('Refreshing newsletter data...');
  };

  const handleNewsletterClick = async (newsletter: any) => {
    // Open the beehiiv URL in a new tab
    if (newsletter.web_url) {
      // First check if the URL is accessible
      try {
        window.open(newsletter.web_url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('Error opening newsletter:', error);
        toast.error('Unable to open newsletter. The link may be broken.');
      }
    } else {
      toast.error('Newsletter URL not available');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-800 flex-shrink-0 bg-gradient-to-r from-slate-950 to-slate-900">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2 w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-white border border-slate-700 hover:bg-slate-800 hover:text-white bg-slate-800/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Newsletter Archive</h1>
                <p className="text-slate-300 text-sm sm:text-base">Weekly market insights and analysis</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-cyan-400">{newsletters?.length || 0}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
            </div>
            
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1.5 flex-shrink-0">
              <Mail className="w-3 h-3 mr-2" />
              Archive
            </Badge>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search newsletters..." 
                className="pl-10 w-full sm:w-64 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest' | 'title') => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="newest" className="text-white hover:bg-slate-700">Newest First</SelectItem>
                  <SelectItem value="oldest" className="text-white hover:bg-slate-700">Oldest First</SelectItem>
                  <SelectItem value="title" className="text-white hover:bg-slate-700">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={isLoading}
                className="text-white border border-slate-700 hover:bg-slate-800 w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncClick}
                disabled={syncNewsletters.isPending}
                className="text-white border-slate-700 hover:bg-slate-800 w-full sm:w-auto"
              >
                <Mail className={`h-4 w-4 mr-2 ${syncNewsletters.isPending ? 'animate-pulse' : ''}`} />
                Sync from beehiiv
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                <p className="text-slate-300">Loading newsletters...</p>
              </div>
            </div>
          ) : filteredNewsletters.length === 0 ? (
            <div className="text-center py-16">
              <Mail className="h-16 w-16 text-slate-500 mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {searchTerm ? 'No newsletters found' : 'No newsletters available'}
              </h2>
              <p className="text-slate-400 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Sync your newsletters from beehiiv to get started'
                }
              </p>
              {!searchTerm && isAdmin && (
                <Button onClick={handleSyncClick} disabled={syncNewsletters.isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Mail className="h-4 w-4 mr-2" />
                  Sync from beehiiv
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNewsletters.map((newsletter) => (
                <ModernCard 
                  key={newsletter.id} 
                  variant="elevated" 
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-slate-900 border-slate-700 hover:border-slate-600"
                  onClick={() => handleNewsletterClick(newsletter)}
                >
                  {/* Featured Image */}
                  {newsletter.featured_image_url && (
                    <div className="w-full h-48 overflow-hidden rounded-t-lg">
                      <img 
                        src={newsletter.featured_image_url} 
                        alt={newsletter.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <ModernCardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <ModernCardTitle className="text-lg group-hover:text-cyan-400 transition-colors line-clamp-2 text-white">
                        {newsletter.title}
                      </ModernCardTitle>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant={newsletter.metadata?.content_type === 'newsletter' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            newsletter.metadata?.content_type === 'newsletter' 
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                              : 'bg-green-500/20 text-green-300 border-green-500/30'
                          }`}
                        >
                          {newsletter.metadata?.content_type === 'newsletter' ? '📧 Newsletter' : '📄 Article'}
                        </Badge>
                        {newsletter.required_tier !== 'free' && (
                          <Badge variant={newsletter.required_tier === 'premium' ? 'default' : 'secondary'} className="text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            {newsletter.required_tier === 'premium' ? '👑' : '⚡'} {newsletter.required_tier}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {newsletter.excerpt && (
                      <p className="text-sm text-slate-400 line-clamp-3 mt-2">
                        {newsletter.excerpt}
                      </p>
                    )}
                  </ModernCardHeader>
                  
                  <ModernCardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs bg-slate-800 text-slate-300 border-slate-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {!newsletter.published_at && !newsletter.beehiiv_created_at && !newsletter.created_at ? (
                          <span className="text-orange-400">Date missing</span>
                        ) : (
                          format(getDisplayDate(newsletter), 'MMM dd, yyyy')
                        )}
                      </Badge>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 hover:bg-slate-800"
                      >
                        Read More
                      </Button>
                    </div>
                  </ModernCardContent>
                </ModernCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}