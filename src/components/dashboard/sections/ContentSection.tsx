
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useContentQueries } from '@/hooks/useContentQueries';
import { CoursesView } from './content/CoursesView';
import { ArticlesView } from './content/ArticlesView';
import { VideosView } from './content/VideosView';
import { NewslettersView } from './content/NewslettersView';
import { ContentOverview } from './content/ContentOverview';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface ContentSectionProps {
  subscriber: Subscriber;
}

export function ContentSection({ subscriber }: ContentSectionProps) {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab');

  const { newsletters, videos, courses, articles } = useContentQueries(subscriber, !!activeTab);

  return (
    <div className="space-y-4">      
      {/* If a specific tab is active, show only that content */}
      {activeTab === 'courses' && <CoursesView courses={courses.data} />}
      {activeTab === 'articles' && <ArticlesView articles={articles.data} />}
      {activeTab === 'videos' && <VideosView videos={videos.data} />}
      {activeTab === 'newsletters' && <NewslettersView />}
      
      {/* Default view showing all content types */}
      {!activeTab && (
        <ContentOverview 
          newsletters={newsletters.data}
          videos={videos.data}
          courses={courses.data}
          articles={articles.data}
        />
      )}
    </div>
  );
}
