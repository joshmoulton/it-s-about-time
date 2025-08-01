import React, { useState } from 'react';
import { useNewsletterForm } from '@/hooks/useNewsletterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, Clock, Eye } from 'lucide-react';

interface CreateNewsletterFormProps {
  onCancel: () => void;
}

export function CreateNewsletterForm({ onCancel }: CreateNewsletterFormProps) {
  const {
    form,
    status,
    setStatus,
    scheduledDate,
    setScheduledDate,
    createNewsletterMutation,
    onSubmit,
    validateScheduledDate,
    getCurrentTimezone
  } = useNewsletterForm(onCancel);

  const { register, handleSubmit, watch, formState: { errors, isValid } } = form;
  const watchedContent = watch('content');
  const estimatedReadTime = Math.max(1, Math.ceil((watchedContent?.length || 0) / 1000));

  const getStatusBadge = (currentStatus: string) => {
    switch (currentStatus) {
      case 'published':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Published</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Scheduled</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Draft</Badge>;
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-slate-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Newsletters
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Newsletter</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-400 text-sm">Status:</span>
              {getStatusBadge(status)}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white">Newsletter Content</CardTitle>
                <CardDescription className="text-slate-400">
                  Create engaging content for your subscribers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-slate-300">Title *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    placeholder="Enter newsletter title..."
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="excerpt" className="text-slate-300">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    {...register('excerpt')}
                    placeholder="Brief description of your newsletter..."
                    rows={3}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content" className="text-slate-300">Content *</Label>
                    <span className="text-xs text-slate-400">
                      Est. read time: {estimatedReadTime} min
                    </span>
                  </div>
                  <Textarea
                    id="content"
                    {...register('content', { required: 'Content is required' })}
                    placeholder="Write your newsletter content here..."
                    rows={12}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                  {errors.content && (
                    <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card className="border border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white">Newsletter Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tags" className="text-slate-300">Tags</Label>
                  <Input
                    id="tags"
                    {...register('tags')}
                    placeholder="crypto, trading, analysis (comma separated)"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <Label htmlFor="read_time_minutes" className="text-slate-300">Read Time (minutes)</Label>
                  <Input
                    id="read_time_minutes"
                    type="number"
                    {...register('read_time_minutes', { 
                      min: { value: 1, message: 'Read time must be at least 1 minute' },
                      valueAsNumber: true
                    })}
                    min="1"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  {errors.read_time_minutes && (
                    <p className="text-red-400 text-sm mt-1">{errors.read_time_minutes.message}</p>
                  )}
                </div>

                {/* Schedule Settings */}
                {status === 'scheduled' && (
                  <div>
                    <Label htmlFor="scheduledDate" className="text-slate-300">
                      Schedule Date ({getCurrentTimezone()})
                    </Label>
                    <Input
                      id="scheduledDate"
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={getMinDateTime()}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {scheduledDate && !validateScheduledDate(scheduledDate) && (
                      <p className="text-red-400 text-sm mt-1">
                        Scheduled date must be in the future
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Publishing Actions */}
            <Card className="border border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white">Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-600/50"
                  onClick={() => {
                    setStatus('draft');
                    handleSubmit(onSubmit)();
                  }}
                  disabled={!isValid || createNewsletterMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-blue-600 text-blue-400 hover:bg-blue-600/10"
                  onClick={() => {
                    setStatus('scheduled');
                  }}
                  disabled={!isValid}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </Button>

                <Button
                  type="button"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    setStatus('published');
                    handleSubmit(onSubmit)();
                  }}
                  disabled={!isValid || createNewsletterMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publish Now
                </Button>

                {status === 'scheduled' && (
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!isValid || !scheduledDate || !validateScheduledDate(scheduledDate) || createNewsletterMutation.isPending}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {createNewsletterMutation.isPending ? 'Scheduling...' : 'Schedule Newsletter'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}