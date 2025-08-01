
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface CreateArticleFormProps {
  onCancel: () => void;
}

interface FormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  required_tier: string;
  author_name: string;
  read_time_minutes: number;
  tags: string;
}

export function CreateArticleForm({ onCancel }: CreateArticleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      category: 'market_analysis',
      required_tier: 'free',
      author_name: 'Weekly Wizdom Team',
      read_time_minutes: 5
    }
  });

  const createArticle = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('articles')
        .insert({
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category,
          required_tier: data.required_tier as any,
          author_name: data.author_name,
          read_time_minutes: data.read_time_minutes,
          tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
          status: 'published'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Article created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      onCancel();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create article",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: FormData) => {
    createArticle.mutate(data);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Article</h1>
          <p className="text-muted-foreground">Write and publish a new article</p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Article Details
          </CardTitle>
          <CardDescription>
            Fill in the article information and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Article title"
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="author_name">Author</Label>
                <Input
                  id="author_name"
                  placeholder="Author name"
                  {...register('author_name', { required: 'Author is required' })}
                />
                {errors.author_name && (
                  <p className="text-sm text-destructive">{errors.author_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief description of the article"
                rows={3}
                {...register('excerpt', { required: 'Excerpt is required' })}
              />
              {errors.excerpt && (
                <p className="text-sm text-destructive">{errors.excerpt.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Article content (supports markdown)"
                rows={15}
                {...register('content', { required: 'Content is required' })}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={watch('category')} onValueChange={(value) => setValue('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market_analysis">Market Analysis</SelectItem>
                    <SelectItem value="trading_tips">Trading Tips</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="required_tier">Required Tier</Label>
                <Select value={watch('required_tier')} onValueChange={(value) => setValue('required_tier', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="read_time_minutes">Read Time (minutes)</Label>
                <Input
                  id="read_time_minutes"
                  type="number"
                  min="1"
                  {...register('read_time_minutes', { 
                    required: 'Read time is required',
                    valueAsNumber: true,
                    min: 1
                  })}
                />
                {errors.read_time_minutes && (
                  <p className="text-sm text-destructive">{errors.read_time_minutes.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="crypto, trading, analysis"
                {...register('tags')}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createArticle.isPending}>
                {createArticle.isPending ? 'Creating...' : 'Create Article'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
