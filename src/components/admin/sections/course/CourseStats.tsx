
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CourseStatsProps {
  courses: any[] | undefined;
}

export function CourseStats({ courses }: CourseStatsProps) {
  const totalCourses = courses?.length || 0;
  const publishedCourses = courses?.filter(c => c.status === 'published').length || 0;
  const totalModules = courses?.reduce((sum, c) => sum + (c.course_modules?.[0]?.count || 0), 0) || 0;
  const totalDuration = courses?.reduce((sum, c) => sum + (c.estimated_duration_hours || 0), 0).toFixed(1) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCourses}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Published</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{publishedCourses}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalModules}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDuration}h</div>
        </CardContent>
      </Card>
    </div>
  );
}
