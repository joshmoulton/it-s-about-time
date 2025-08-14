import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TopicSelectorProps {
  selectedTopic: string | null;
  onTopicChange: (topicId: string | null) => void;
}

interface TopicMapping {
  id: string;
  telegram_topic_id: number;
  custom_name: string;
  last_active: string;
}

export function TopicSelector({ selectedTopic, onTopicChange }: TopicSelectorProps) {
  // Use exact database topic_name values for proper filtering
  const workingTopics = [
    { id: '1', custom_name: 'Money Glitch' },
    { id: '2', custom_name: 'STOCKS & OPTIONS' } // Exact match for database value
  ];

  // Set default selection to "Money Glitch" if no topic is selected
  useEffect(() => {
    if (!selectedTopic) {
      onTopicChange('Money Glitch');
    }
  }, [selectedTopic, onTopicChange]);

  return (
    <Select value={selectedTopic || 'Money Glitch'} onValueChange={(value) => onTopicChange(value)}>
      <SelectTrigger className="w-32 sm:w-40 h-8 text-xs bg-slate-700 text-white border-slate-600 focus:border-blue-500">
        <SelectValue placeholder="Money Glitch" />
      </SelectTrigger>
      <SelectContent className="z-[99999] bg-slate-800 border-slate-700 text-white backdrop-blur-sm shadow-xl min-w-[140px] sm:min-w-[160px]" position="popper" sideOffset={8} align="start" avoidCollisions={true} collisionPadding={10}>
        {workingTopics.map((topic) => (
          <SelectItem 
            key={topic.id} 
            value={topic.custom_name} 
            className="text-xs hover:bg-slate-700 focus:bg-slate-700 px-2 py-2"
          >
            <div className="flex items-center gap-2 w-full">
              <MessageSquare className="h-3 w-3 flex-shrink-0" />
              <span className="truncate text-xs">{topic.custom_name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
