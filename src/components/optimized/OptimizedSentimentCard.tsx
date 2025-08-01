import React from 'react';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TopicData {
  topic: string;
  sentiment: string;
  mentions: number;
  source: string;
  color: string;
}

interface OptimizedSentimentCardProps {
  topic: TopicData;
  onViewDetails: (topic: string) => void;
}

export const OptimizedSentimentCard = React.memo<OptimizedSentimentCardProps>(({ 
  topic, 
  onViewDetails 
}) => {
  const handleViewDetails = React.useCallback(() => {
    onViewDetails(topic.topic);
  }, [topic.topic, onViewDetails]);

  return (
    <ModernCard variant="elevated" className="group hover:shadow-xl transition-all duration-300 bg-slate-900 border-slate-700 hover:border-slate-600">
      <ModernCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <ModernCardTitle className="text-lg text-white">{topic.topic}</ModernCardTitle>
          <Badge className={`${topic.color} border-0`}>
            {topic.sentiment}
          </Badge>
        </div>
      </ModernCardHeader>
      
      <ModernCardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Source:</span>
            <span className="text-sm font-medium text-slate-300">{topic.source}</span>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              {topic.mentions} mentions
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:bg-slate-800"
              onClick={handleViewDetails}
            >
              View Details
            </Button>
          </div>
        </div>
      </ModernCardContent>
    </ModernCard>
  );
});

OptimizedSentimentCard.displayName = 'OptimizedSentimentCard';