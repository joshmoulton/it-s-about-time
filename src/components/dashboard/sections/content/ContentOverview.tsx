
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Mail, GraduationCap, FileText, Calendar, Play } from 'lucide-react';
import { format } from 'date-fns';
import { formatDuration } from '@/utils/formatDuration';

interface ContentOverviewProps {
  newsletters: any[] | undefined;
  videos: any[] | undefined;
  courses: any[] | undefined;
  articles: any[] | undefined;
}

export function ContentOverview({ newsletters, videos, courses, articles }: ContentOverviewProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Content</h1>
        <p className="text-muted-foreground">Access all your content and learning materials</p>
      </div>
      
      {/* Newsletter Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Newsletter</h2>
          </div>
          <Button>View All Newsletters</Button>
        </div>
        <p className="text-muted-foreground">Weekly market insights and analysis</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsletters?.map((newsletter) => (
            <Card key={newsletter.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{newsletter.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {newsletter.published_at ? format(new Date(newsletter.published_at), 'MMM dd') : 'Draft'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {newsletter.excerpt || 'Weekly market insights and trading analysis...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{newsletter.read_time_minutes} min read</span>
                  <Button size="sm">Read Now</Button>
                </div>
              </CardContent>
            </Card>
          )) || (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No newsletters available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>

      {/* The Edge Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <h2 className="text-xl font-semibold">The Edge</h2>
          </div>
          <Button>View All Videos</Button>
        </div>
        <p className="text-muted-foreground">Video tutorials and trading insights</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos?.map((video) => (
            <Card key={video.id} className="hover:shadow-md transition-shadow">
              <div className="relative">
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Play className="h-4 w-4 text-white ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  {video.duration_seconds && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {formatDuration(video.duration_seconds)}
                    </div>
                  )}
                </div>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{video.title}</CardTitle>
                <CardDescription>{video.description || 'Professional trading insights and strategies'}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Watch Now
                </Button>
              </CardContent>
            </Card>
          )) || (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No videos available for your subscription tier.</p>
            </div>
          )}
        </div>
      </div>

      {/* Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Courses</h2>
          </div>
          <Button>Browse All Courses</Button>
        </div>
        <p className="text-muted-foreground">Interactive learning courses</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses?.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>
                  {course.estimated_duration_hours ? `${course.estimated_duration_hours}h` : ''} • {course.difficulty_level || 'beginner'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  Start Course
                </Button>
              </CardContent>
            </Card>
          )) || (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No courses available for your subscription tier.</p>
            </div>
          )}
        </div>
      </div>

      {/* Articles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Articles</h2>
          </div>
          <Button>Read All Articles</Button>
        </div>
        <p className="text-muted-foreground">In-depth market analysis articles</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles?.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{article.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {article.excerpt || 'Comprehensive market analysis and trading insights...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">By {article.author_name}</span>
                  <span className="text-sm text-muted-foreground">{article.read_time_minutes} min read</span>
                </div>
                <Button size="sm" className="w-full">Read Article</Button>
              </CardContent>
            </Card>
          )) || (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No articles available for your subscription tier.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
