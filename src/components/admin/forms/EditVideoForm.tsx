import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, Link, Video, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditVideoFormProps {
  videoId: string;
  initialData: any;
  onCancel: () => void;
}

interface VideoFormData {
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  status: 'draft' | 'published' | 'unlisted';
  required_tier: 'free' | 'paid' | 'premium';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  duration_seconds: number;
}

export function EditVideoForm({ videoId, initialData, onCancel }: EditVideoFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [videoSource, setVideoSource] = useState<'upload' | 'vimeo'>('vimeo');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<VideoFormData>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      video_url: initialData?.video_url || '',
      thumbnail_url: initialData?.thumbnail_url || '',
      status: initialData?.status || 'draft',
      required_tier: initialData?.required_tier || 'free',
      difficulty_level: initialData?.difficulty_level || 'beginner',
      duration_seconds: initialData?.duration_seconds || 0
    }
  });

  useEffect(() => {
    // Set video source based on URL pattern
    if (initialData?.video_url?.includes('vimeo.com')) {
      setVideoSource('vimeo');
    } else {
      setVideoSource('upload');
    }
  }, [initialData]);

  const updateVideoMutation = useMutation({
    mutationFn: async (data: VideoFormData) => {
      console.log('Updating video with data:', data);
      
      const { error } = await supabase
        .from('video_tutorials')
        .update({
          ...data,
          tags
        })
        .eq('id', videoId);
      
      if (error) {
        console.error('Error updating video:', error);
        throw error;
      }
      
      console.log('Video updated successfully');
    },
    onSuccess: () => {
      toast({
        title: "Video updated successfully!",
        description: "Your changes have been saved."
      });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      onCancel();
    },
    onError: (error) => {
      console.error('Video update error:', error);
      toast({
        title: "Error updating video",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: VideoFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Tags:', tags);
    updateVideoMutation.mutate(data);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const extractVimeoId = (url: string) => {
    const regex = /vimeo\.com\/(?:.*\/)?([0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchVimeoThumbnail = async (vimeoUrl: string) => {
    try {
      const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.thumbnail_url) {
          setValue('thumbnail_url', data.thumbnail_url);
          toast({
            title: "Thumbnail imported",
            description: "Thumbnail automatically imported from Vimeo"
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch Vimeo thumbnail:', error);
    }
  };

  const handleVimeoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setValue('video_url', url);
    
    if (url && extractVimeoId(url)) {
      fetchVimeoThumbnail(url);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Videos
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Video</h1>
          <p className="text-muted-foreground">Update video information and settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Details</CardTitle>
                <CardDescription>Basic information about your video tutorial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    placeholder="Enter video title..."
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe what viewers will learn from this video..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add tags (press Enter)"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Video Source</CardTitle>
                <CardDescription>Update your video content source</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={videoSource === 'vimeo' ? 'default' : 'outline'}
                    onClick={() => setVideoSource('vimeo')}
                    className="flex-1"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Vimeo Link
                  </Button>
                  <Button
                    type="button"
                    variant={videoSource === 'upload' ? 'default' : 'outline'}
                    onClick={() => setVideoSource('upload')}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>

                {videoSource === 'vimeo' ? (
                  <div>
                    <Label htmlFor="video_url">Vimeo URL *</Label>
                    <Input
                      id="video_url"
                      {...register('video_url', { 
                        required: videoSource === 'vimeo' ? 'Video URL is required' : false,
                        pattern: videoSource === 'vimeo' ? {
                          value: /vimeo\.com\/(?:.*\/)?([0-9]+)/,
                          message: 'Please enter a valid Vimeo URL'
                        } : undefined
                      })}
                      onChange={handleVimeoUrlChange}
                      placeholder="https://vimeo.com/123456789"
                    />
                    {errors.video_url && (
                      <p className="text-sm text-destructive mt-1">{errors.video_url.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste the full Vimeo URL - thumbnail will be imported automatically
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Upload New Video File</p>
                    <p className="text-muted-foreground mb-4">
                      Drag and drop your video file here, or click to browse
                    </p>
                    <Button type="button" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supported formats: MP4, MOV, AVI (Max 500MB)
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                  <Input
                    id="thumbnail_url"
                    {...register('thumbnail_url')}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Custom thumbnail image URL
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="unlisted">Unlisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="required_tier">Required Tier</Label>
                  <Select value={watch('required_tier')} onValueChange={(value) => setValue('required_tier', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty_level">Difficulty Level</Label>
                  <Select value={watch('difficulty_level')} onValueChange={(value) => setValue('difficulty_level', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration_seconds">Duration (seconds)</Label>
                  <Input
                    id="duration_seconds"
                    type="number"
                    {...register('duration_seconds', { valueAsNumber: true })}
                    placeholder="Video duration in seconds"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Video duration for display purposes
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Title:</strong> {watch('title') || 'Untitled Video'}</p>
                  <p><strong>Status:</strong> {watch('status') || 'Draft'}</p>
                  <p><strong>Tier:</strong> {watch('required_tier') || 'Free'}</p>
                  <p><strong>Difficulty:</strong> {watch('difficulty_level') || 'Beginner'}</p>
                  {tags.length > 0 && (
                    <p><strong>Tags:</strong> {tags.join(', ')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-brand-primary hover:bg-brand-primary/90"
            disabled={updateVideoMutation.isPending}
          >
            {updateVideoMutation.isPending ? 'Updating...' : 'Update Video'}
          </Button>
        </div>
      </form>
    </div>
  );
}