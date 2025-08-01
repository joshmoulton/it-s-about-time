
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';

interface NewsletterFormData {
  title: string;
  excerpt: string;
  content: string;
  tags: string;
  read_time_minutes: number;
}

interface NewsletterContentSectionProps {
  form: UseFormReturn<NewsletterFormData>;
  watchedContent: string;
  estimatedReadTime: number;
}

export function NewsletterContentSection({ form, watchedContent, estimatedReadTime }: NewsletterContentSectionProps) {
  const { register, formState: { errors } } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Newsletter Content</CardTitle>
        <CardDescription>Create engaging content for your subscribers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Enter newsletter title..."
            {...register('title', { required: 'Title is required' })}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            placeholder="Brief summary of your newsletter (optional)..."
            rows={2}
            {...register('excerpt')}
          />
          <p className="text-xs text-muted-foreground">
            This will appear as a preview in email clients and the newsletter list
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            placeholder="Write your newsletter content here..."
            rows={15}
            className="min-h-[300px]"
            {...register('content', { required: 'Content is required' })}
          />
          {errors.content && (
            <p className="text-sm text-destructive">{errors.content.message}</p>
          )}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{watchedContent?.length || 0} characters</span>
            <span>Est. {estimatedReadTime} min read</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
