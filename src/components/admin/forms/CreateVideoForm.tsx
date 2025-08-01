import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateVideoFormProps {
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

export function CreateVideoForm({ onCancel }: CreateVideoFormProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [workshopNumber, setWorkshopNumber] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<VideoFormData>({
    defaultValues: {
      title: 'The Edge - Workshop',
      status: 'published',
      required_tier: 'free',
      difficulty_level: 'beginner'
    }
  });

  const createVideoMutation = useMutation({
    mutationFn: async (data: VideoFormData) => {
      console.log('Creating video with data:', data);
      
      const { error } = await supabase
        .from('video_tutorials')
        .insert([{
          ...data,
          tags
        }]);
      
      if (error) {
        console.error('Error creating video:', error);
        throw error;
      }
      
      console.log('Video created successfully');
    },
    onSuccess: () => {
      toast({
        title: "Video created successfully!",
        description: "Your video has been saved and is ready for review."
      });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      onCancel();
    },
    onError: (error) => {
      console.error('Video creation error:', error);
      toast({
        title: "Error creating video",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: VideoFormData) => {
    const finalTitle = workshopNumber ? `The Edge - Workshop #${workshopNumber}` : 'The Edge - Workshop';
    const finalData = { ...data, title: finalTitle };
    console.log('Form submitted with data:', finalData);
    console.log('Tags:', tags);
    createVideoMutation.mutate(finalData);
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
      const { data, error } = await supabase.functions.invoke('fetch-vimeo-thumbnail', {
        body: { vimeoUrl }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        return;
      }
      
      if (data?.thumbnailUrl) {
        setValue('thumbnail_url', data.thumbnailUrl);
        toast({
          title: "Thumbnail imported",
          description: "Thumbnail automatically imported from Vimeo"
        });
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
          <h1 className="text-3xl font-bold">Add New Video</h1>
          <p className="text-muted-foreground">Create a new video tutorial for "The Edge"</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create Video Tutorial</CardTitle>
              <CardDescription>Add a new workshop video to "The Edge"</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="workshop-number">Workshop Number</Label>
                <Input
                  id="workshop-number"
                  value={workshopNumber}
                  onChange={(e) => setWorkshopNumber(e.target.value)}
                  placeholder="36"
                  className="w-24"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Title will be: "The Edge - Workshop #{workshopNumber || '___'}"
                </p>
              </div>

              <div>
                <Label htmlFor="video_url">Vimeo URL *</Label>
                <Input
                  id="video_url"
                  {...register('video_url', { 
                    required: 'Video URL is required',
                    pattern: {
                      value: /vimeo\.com\/(?:.*\/)?([0-9]+)/,
                      message: 'Please enter a valid Vimeo URL'
                    }
                  })}
                  onChange={handleVimeoUrlChange}
                  placeholder="https://vimeo.com/123456789"
                />
                {errors.video_url && (
                  <p className="text-sm text-destructive mt-1">{errors.video_url.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  {...register('thumbnail_url')}
                  placeholder="https://example.com/thumbnail.jpg"
                />
                {errors.thumbnail_url && (
                  <p className="text-sm text-destructive mt-1">{errors.thumbnail_url.message}</p>
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

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createVideoMutation.isPending}
                  className="flex-1"
                >
                  {createVideoMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Video...
                    </>
                  ) : (
                    'Create Video'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}