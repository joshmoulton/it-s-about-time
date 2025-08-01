
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Video, Calendar, Eye, Trash2, Edit, MoreHorizontal } from 'lucide-react';
import { VideoCreation } from './VideoCreation';
import { EditVideoForm } from '../forms/EditVideoForm';

import { formatDuration } from '@/utils/formatDuration';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function VideoManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'paid' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'workshop' | 'newest' | 'oldest' | 'title' | 'views'>('workshop');
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_tutorials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredVideos = videos?.filter(video => {
    const matchesSearch = video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || video.required_tier === tierFilter;
    
    return matchesSearch && matchesTier;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'workshop':
        // Extract workshop number from title (assuming format like "Workshop #1" or "#1")
        const getWorkshopNumber = (title: string) => {
          const match = title?.match(/#(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        return getWorkshopNumber(a.title || '') - getWorkshopNumber(b.title || '');
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'views':
        return (b.view_count || 0) - (a.view_count || 0);
      default:
        return 0;
    }
  }) || [];

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from('video_tutorials')
        .delete()
        .eq('id', videoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video deleted successfully');
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Delete video error:', error);
      toast.error(`Failed to delete video: ${error.message}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (videoIds: string[]) => {
      const { error } = await supabase
        .from('video_tutorials')
        .delete()
        .in('id', videoIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success(`${selectedVideos.length} videos deleted successfully`);
      setSelectedVideos([]);
    },
    onError: (error: Error) => {
      console.error('Bulk delete error:', error);
      toast.error(`Failed to delete videos: ${error.message}`);
    },
  });

  const handleEditVideo = (video: any) => {
    setEditingVideo(video);
  };

  const handleDeleteVideo = (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (videoToDelete) {
      deleteVideoMutation.mutate(videoToDelete);
    }
  };

  const handleBulkDelete = () => {
    if (selectedVideos.length > 0) {
      bulkDeleteMutation.mutate(selectedVideos);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'draft': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (showCreateForm) {
    return <VideoCreation onCancel={() => setShowCreateForm(false)} />;
  }

  if (editingVideo) {
    return (
      <EditVideoForm 
        videoId={editingVideo.id}
        initialData={editingVideo}
        onCancel={() => setEditingVideo(null)} 
      />
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Video Management</h1>
          <p className="text-slate-400">Upload and manage video tutorials</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Video
        </Button>
      </div>



      {/* Enhanced Search and Filters */}
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="workshop">Workshop # Order</option>
              <option value="newest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="views">Most Views</option>
            </select>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex-1"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="flex-1"
              >
                Table
              </Button>
            </div>
          </div>
          
          {selectedVideos.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-blue-400 text-sm">
                {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected
              </span>
              <Button size="sm" variant="outline" className="text-blue-400 border-blue-500/50">
                Bulk Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-400 border-red-500/50"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setSelectedVideos([])}
                className="text-slate-400"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Videos Grid */}
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Video className="h-5 w-5 text-purple-400" />
            Videos ({filteredVideos.length})
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your video tutorial library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-slate-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No videos found</h3>
              <p className="text-slate-400 mb-4">
                {searchTerm ? 'No videos match your search.' : 'Get started by uploading your first video.'}
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left p-3 text-slate-400 font-medium">
                      <input
                        type="checkbox"
                        checked={selectedVideos.length === filteredVideos.length && filteredVideos.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVideos(filteredVideos.map(v => v.id));
                          } else {
                            setSelectedVideos([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left p-3 text-slate-400 font-medium">Title</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Status</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Tier</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Views</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Created</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((video) => (
                    <tr key={video.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedVideos.includes(video.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVideos([...selectedVideos, video.id]);
                            } else {
                              setSelectedVideos(selectedVideos.filter(id => id !== video.id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-slate-700 rounded flex items-center justify-center">
                            {video.thumbnail_url ? (
                              <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover rounded" />
                            ) : (
                              <Video className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">{video.title || 'Untitled'}</div>
                            <div className="text-sm text-slate-400 line-clamp-1">{video.description || 'No description'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(video.status || 'draft')}>
                          {video.status || 'draft'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-slate-300 border-slate-600">
                          {video.required_tier || 'free'}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-300">{video.view_count || 0}</td>
                      <td className="p-3 text-slate-400">{new Date(video.created_at).toLocaleDateString()}</td>
                       <td className="p-3">
                         <div className="flex gap-2">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="text-slate-300 border-slate-600"
                             onClick={() => handleEditVideo(video)}
                           >
                             <Edit className="h-3 w-3 mr-1" />
                             Edit
                           </Button>
                           <Button variant="outline" size="sm" className="text-slate-300 border-slate-600">
                             <Eye className="h-3 w-3" />
                           </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-400 border-red-500/50 hover:bg-red-500/10"
                            onClick={() => handleDeleteVideo(video.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <div key={video.id} className="bg-slate-700/30 rounded-lg border border-slate-600/50 overflow-hidden hover:bg-slate-600/30 transition-colors flex flex-col min-h-[400px]">
                  <div className="relative">
                    <div className="aspect-video bg-slate-800 relative overflow-hidden rounded-lg">
                      {video.thumbnail_url ? (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title || 'Video thumbnail'}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                          <Video className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={selectedVideos.includes(video.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVideos([...selectedVideos, video.id]);
                            } else {
                              setSelectedVideos(selectedVideos.filter(id => id !== video.id));
                            }
                          }}
                          className="rounded bg-black/50"
                        />
                      </div>
                      {video.duration_seconds && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration_seconds)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col h-full">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 min-h-[3rem]">
                      {video.title || 'Untitled Video'}
                    </h3>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
                      {video.description || 'No description'}
                    </p>
                    <div className="flex gap-2 mt-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-slate-300 border-slate-600 hover:text-white hover:border-slate-400"
                        onClick={() => handleEditVideo(video)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="text-slate-300 border-slate-600 hover:text-white hover:border-slate-400">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-3 w-3 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-400"
                            onClick={() => handleDeleteVideo(video.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteVideoMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteVideoMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
