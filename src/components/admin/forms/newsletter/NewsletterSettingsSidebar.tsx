import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UseFormReturn } from 'react-hook-form';
import { Clock, AlertCircle } from 'lucide-react';

interface NewsletterFormData {
  title: string;
  excerpt: string;
  content: string;
  tags: string;
  read_time_minutes: number;
}

interface NewsletterSettingsSidebarProps {
  form: UseFormReturn<NewsletterFormData>;
  status: 'draft' | 'published' | 'scheduled';
  scheduledDate: string;
  setScheduledDate: (date: string) => void;
  validateScheduledDate?: (date: string) => boolean;
  getCurrentTimezone?: () => string;
}

export function NewsletterSettingsSidebar({ 
  form, 
  status, 
  scheduledDate, 
  setScheduledDate,
  validateScheduledDate,
  getCurrentTimezone
}: NewsletterSettingsSidebarProps) {
  const { register, formState: { errors } } = form;
  
  const timezone = getCurrentTimezone ? getCurrentTimezone() : 'UTC';
  const isValidScheduledDate = validateScheduledDate ? validateScheduledDate(scheduledDate) : true;
  
  // Generate minimum datetime for input (current time + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Newsletter Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="crypto, trading, market analysis"
            {...register('tags')}
          />
          <p className="text-xs text-muted-foreground">
            Separate tags with commas
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="read_time">Read Time (minutes)</Label>
          <Input
            id="read_time"
            type="number"
            min="1"
            max="60"
            {...register('read_time_minutes', { 
              valueAsNumber: true,
              min: { value: 1, message: 'Minimum 1 minute' },
              max: { value: 60, message: 'Maximum 60 minutes' }
            })}
          />
          {errors.read_time_minutes && (
            <p className="text-sm text-destructive">{errors.read_time_minutes.message}</p>
          )}
        </div>

        <Separator />

        {status === 'scheduled' && (
          <div className="space-y-2">
            <Label htmlFor="scheduled_date" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Schedule Date & Time
            </Label>
            <Input
              id="scheduled_date"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={getMinDateTime()}
              className={!isValidScheduledDate ? 'border-red-500' : ''}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Timezone: {timezone}</span>
            </div>
            {scheduledDate && !isValidScheduledDate && (
              <div className="flex items-center gap-2 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                <span>Scheduled date must be in the future</span>
              </div>
            )}
            {scheduledDate && isValidScheduledDate && (
              <div className="text-xs text-green-600">
                ✓ Newsletter will be published at the scheduled time
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}