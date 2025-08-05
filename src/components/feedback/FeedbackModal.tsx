import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bug, MessageSquare, Lightbulb, HelpCircle, Send, AlertCircle } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons = {
  bug: Bug,
  feature_request: Lightbulb,
  feedback: MessageSquare,
  support: HelpCircle
};

const categoryLabels = {
  bug: 'Bug Report',
  feature_request: 'Feature Request',
  feedback: 'General Feedback',
  support: 'Support Request'
};

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { subscriber, currentUser } = useEnhancedAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'feedback' as 'bug' | 'feature_request' | 'feedback' | 'support'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user email from multiple sources with better validation
      const userEmail = subscriber?.email || currentUser?.email || 'anonymous@feedback.com';
      
      // Validate email format if not anonymous
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (userEmail !== 'anonymous@feedback.com' && !emailRegex.test(userEmail)) {
        throw new Error('Invalid email format detected');
      }
      
      // Collect enhanced browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled
      };

      const feedbackData = {
        user_email: userEmail,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        browser_info: browserInfo,
        page_url: window.location.href
      };

      console.log('📝 Submitting feedback:', { 
        userEmail, 
        category: formData.category, 
        hasAuth: !!supabase.auth.getUser() 
      });

      let success = false;
      let lastError = null;
      let attemptCount = 0;

      // Simplified submission approach - try direct insertion first
      attemptCount++;
      console.log(`Attempt ${attemptCount}: Direct Supabase insertion`);
      
      try {
        const { data, error } = await supabase.from('feedback').insert(feedbackData).select();
        
        if (!error && data) {
          success = true;
          console.log('✅ Feedback submitted successfully via direct insertion:', data);
        } else {
          lastError = error;
          console.warn('❌ Direct insertion failed:', error);
        }
      } catch (error) {
        lastError = error;
        console.warn('❌ Direct insertion exception:', error);
      }

      // Fallback: Edge function with retry mechanism
      if (!success) {
        for (let retryCount = 0; retryCount < 2; retryCount++) {
          attemptCount++;
          console.log(`Attempt ${attemptCount}: Edge function (retry ${retryCount + 1})`);
          
          try {
            const response = await supabase.functions.invoke('submit-feedback', {
              body: feedbackData
            });

            if (response.data?.success) {
              success = true;
              console.log('✅ Feedback submitted successfully via edge function:', response.data);
              break;
            } else {
              lastError = response.error || new Error('Edge function returned unsuccessful response');
              console.warn(`❌ Edge function failed (retry ${retryCount + 1}):`, response.error);
            }
          } catch (error) {
            lastError = error;
            console.warn(`❌ Edge function exception (retry ${retryCount + 1}):`, error);
            
            // Wait before retry
            if (retryCount < 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }

      if (success) {
        toast.success('Feedback submitted successfully! We\'ll review it soon.');
        setFormData({ title: '', description: '', category: 'feedback' });
        onClose();
      } else {
        // Provide specific error messages based on the error type
        let errorMessage = 'Failed to submit feedback. ';
        
        if (lastError?.message?.includes('permission') || lastError?.message?.includes('policy')) {
          errorMessage += 'You may need to be logged in to submit feedback.';
        } else if (lastError?.message?.includes('network') || lastError?.message?.includes('fetch')) {
          errorMessage += 'Please check your internet connection and try again.';
        } else if (lastError?.message?.includes('rate limit')) {
          errorMessage += 'Please wait a moment before submitting again.';
        } else {
          errorMessage += 'Please try again or contact support if the issue persists.';
        }
        
        console.error('🚨 All feedback submission attempts failed:', {
          attempts: attemptCount,
          lastError: lastError?.message || lastError,
          userEmail,
          feedbackData
        });
        
        toast.error(errorMessage);
      }

    } catch (error) {
      console.error('🚨 Unexpected error during feedback submission:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CategoryIcon = categoryIcons[formData.category];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto my-8 bg-slate-900 border-slate-700 text-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-white text-lg">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            Send Feedback
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="category" className="text-slate-200 text-sm font-medium">
              Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 focus:border-blue-400">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-white">{categoryLabels[formData.category]}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {Object.entries(categoryLabels).map(([value, label]) => {
                  const Icon = categoryIcons[value as keyof typeof categoryIcons];
                  return (
                    <SelectItem 
                      key={value} 
                      value={value}
                      className="text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-400" />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="title" className="text-slate-200 text-sm font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of your feedback"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-slate-200 text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please provide detailed information about your feedback, bug report, or feature request..."
              className="min-h-[120px] bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Feedback
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}