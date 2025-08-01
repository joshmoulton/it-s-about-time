
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface NewsletterFormData {
  title: string;
  excerpt: string;
  content: string;
  tags: string;
  read_time_minutes: number;
}

export function useNewsletterForm(onCancel: () => void) {
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [scheduledDate, setScheduledDate] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscriber } = useAuth();

  // Validate scheduled date is in the future
  const validateScheduledDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const scheduledTime = new Date(dateString);
    const now = new Date();
    return scheduledTime > now;
  };

  // Format date for database storage (UTC)
  const formatDateForDatabase = (dateString: string): string => {
    return new Date(dateString).toISOString();
  };

  // Get current user timezone for display
  const getCurrentTimezone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const form = useForm<NewsletterFormData>({
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      tags: '',
      read_time_minutes: 5
    }
  });

  const createNewsletterMutation = useMutation({
    mutationFn: async (data: NewsletterFormData & { status: string; scheduled_at?: string }) => {
      try {
        // Validate required fields
        if (!data.title.trim()) {
          throw new Error('Newsletter title is required');
        }
        if (!data.content.trim()) {
          throw new Error('Newsletter content is required');
        }

        // Validate scheduled date if status is scheduled
        if (data.status === 'scheduled') {
          if (!data.scheduled_at) {
            throw new Error('Scheduled date is required for scheduled newsletters');
          }
          if (!validateScheduledDate(data.scheduled_at)) {
            throw new Error('Scheduled date must be in the future');
          }
        }

        // Ensure user is authenticated
        if (!subscriber?.id) {
          throw new Error('You must be logged in to create a newsletter');
        }

        // Prepare the newsletter data
        const newsletterData = {
          title: data.title.trim(),
          excerpt: data.excerpt?.trim() || null,
          content: data.content.trim(),
          tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          read_time_minutes: data.read_time_minutes || 5,
          status: data.status,
          scheduled_at: data.status === 'scheduled' && data.scheduled_at ? 
            formatDateForDatabase(data.scheduled_at) : null,
          published_at: data.status === 'published' ? 
            new Date().toISOString() : null,
          author_id: subscriber.id
        };

        const { error } = await supabase
          .from('newsletters')
          .insert(newsletterData);

        if (error) {
          console.error('Supabase error details:', error);
          throw error;
        }
      } catch (error) {
        console.error('Newsletter creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-newsletters'] });
      toast({
        title: 'Success!',
        description: `Newsletter ${status === 'published' ? 'published' : status === 'scheduled' ? 'scheduled' : 'saved as draft'} successfully.`,
      });
      onCancel();
    },
    onError: (error: any) => {
      console.error('Newsletter creation error:', error);
      let errorMessage = 'Failed to create newsletter. Please try again.';
      
      if (error?.code === '42501') {
        errorMessage = 'Permission denied. Please check your admin privileges.';
      } else if (error?.code === '23505') {
        errorMessage = 'A newsletter with this title already exists.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: NewsletterFormData) => {
    // Additional client-side validation
    if (status === 'scheduled' && !scheduledDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select a schedule date for scheduled newsletters.',
        variant: 'destructive',
      });
      return;
    }

    if (status === 'scheduled' && scheduledDate && !validateScheduledDate(scheduledDate)) {
      toast({
        title: 'Validation Error',
        description: 'Scheduled date must be in the future.',
        variant: 'destructive',
      });
      return;
    }

    const submitData = {
      ...data,
      status,
      ...(status === 'scheduled' && scheduledDate ? { scheduled_at: scheduledDate } : {})
    };
    
    createNewsletterMutation.mutate(submitData);
  };

  const handlePreview = () => {
    toast({
      title: 'Preview',
      description: 'Preview functionality will be implemented soon.',
    });
  };

  return {
    form,
    status,
    setStatus,
    scheduledDate,
    setScheduledDate,
    createNewsletterMutation,
    onSubmit,
    handlePreview,
    validateScheduledDate,
    getCurrentTimezone
  };
}
