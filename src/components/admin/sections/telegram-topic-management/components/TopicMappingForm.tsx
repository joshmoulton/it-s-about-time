
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface TopicMappingFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export function TopicMappingForm({ initialData, onSubmit, isLoading }: TopicMappingFormProps) {
  const [formData, setFormData] = useState({
    telegram_topic_id: initialData?.telegram_topic_id || '',
    custom_name: initialData?.custom_name || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      telegram_topic_id: parseInt(formData.telegram_topic_id)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="telegram_topic_id" className="text-sm font-medium text-card-foreground">
          Telegram Topic ID
        </Label>
        <Input
          id="telegram_topic_id"
          type="number"
          value={formData.telegram_topic_id}
          onChange={(e) => setFormData({ ...formData, telegram_topic_id: e.target.value })}
          required
          disabled={!!initialData}
          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          placeholder="Enter topic ID"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="custom_name" className="text-sm font-medium text-card-foreground">
          Topic Name
        </Label>
        <Input
          id="custom_name"
          value={formData.custom_name}
          onChange={(e) => setFormData({ ...formData, custom_name: e.target.value })}
          required
          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          placeholder="Enter topic display name"
        />
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {initialData ? 'Update' : 'Create'} Mapping
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
