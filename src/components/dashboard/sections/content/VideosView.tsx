import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Search, Filter, ArrowLeft } from 'lucide-react';
import { formatDuration } from '@/utils/formatDuration';


interface Video {
  id: string;
  title: string;
  description: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  video_url: string | null;
  difficulty_level: string | null;
  required_tier: 'free' | 'paid' | 'premium';
  status: string;
  tags: string[] | null;
  created_at: string;
}

interface VideosViewProps {
  videos: Video[] | undefined;
}

export function VideosView({ videos }: VideosViewProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 12;

  // Helper function to extract workshop number from title
  const extractWorkshopNumber = (title: string): number | null => {
    const match = title.match(/workshop\s*#?(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    
    const filtered = videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           video.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });

    // Sort the filtered videos
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // For workshop videos, prioritize workshop number sorting
          const aWorkshopNum = extractWorkshopNumber(a.title);
          const bWorkshopNum = extractWorkshopNumber(b.title);
          
          if (aWorkshopNum !== null && bWorkshopNum !== null) {
            return bWorkshopNum - aWorkshopNum; // Higher workshop numbers first
          }
          // Fall back to date for non-workshop videos
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
          
        case 'oldest':
          // For workshop videos, prioritize workshop number sorting
          const aWorkshopNumOld = extractWorkshopNumber(a.title);
          const bWorkshopNumOld = extractWorkshopNumber(b.title);
          
          if (aWorkshopNumOld !== null && bWorkshopNumOld !== null) {
            return aWorkshopNumOld - bWorkshopNumOld; // Lower workshop numbers first
          }
          // Fall back to date for non-workshop videos
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
          
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [videos, searchTerm, sortBy]);

  const paginatedVideos = useMemo(() => {
    const startIndex = (currentPage - 1) * videosPerPage;
    return filteredVideos.slice(startIndex, startIndex + videosPerPage);
  }, [filteredVideos, currentPage]);

  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paid': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'premium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleWatchVideo = (video: Video) => {
    if (video.video_url) {
      window.open(video.video_url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        
        {/* Content */}
        <div className="relative z-10 p-6 space-y-6">
          
          
          {/* Header */}
          <div className="space-y-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="w-fit bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-white">The Edge Videos</h1>
              <p className="text-slate-400">Video tutorials and trading insights</p>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-sm text-white focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
              >
                <option value="newest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          {videos && filteredVideos.length !== videos.length && (
            <p className="text-sm text-slate-400">
              Showing {filteredVideos.length} of {videos.length} videos
            </p>
          )}
          
          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedVideos.length > 0 ? paginatedVideos.map((video) => (
              <Card key={video.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden bg-slate-800/50 border-slate-700 hover:border-slate-600">
                <div className="relative">
                  <div className="aspect-video bg-slate-900 relative overflow-hidden rounded-t-lg">
                    {video.thumbnail_url ? (
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <Play className="h-12 w-12 text-slate-500" />
                      </div>
                    )}
                    
                    {/* Play button overlay */}
                    <div 
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center cursor-pointer"
                      onClick={() => handleWatchVideo(video)}
                    >
                      <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm pointer-events-none">
                        <Play className="h-4 w-4 text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    
                    {/* Duration badge */}
                    {video.duration_seconds && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
                        {formatDuration(video.duration_seconds)}
                      </div>
                    )}
                    
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg leading-tight line-clamp-2 text-white">{video.title}</CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2 text-slate-400">
                    {video.description || 'Professional trading insights and strategies'}
                  </CardDescription>
                  
                  {/* Tags */}
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {video.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-slate-600 text-slate-300">
                          {tag}
                        </Badge>
                      ))}
                      {video.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                          +{video.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <Button 
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600" 
                    onClick={() => handleWatchVideo(video)}
                    disabled={!video.video_url}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch Now
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-12">
                {videos && videos.length > 0 ? (
                  <div className="text-slate-400">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No videos match your filters</p>
                    <p>Try adjusting your search or filter criteria</p>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No videos available</p>
                    <p>Check back soon for new content!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-slate-600 text-slate-300"
              >
                Previous
              </Button>
              <span className="text-slate-400 px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-slate-600 text-slate-300"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}