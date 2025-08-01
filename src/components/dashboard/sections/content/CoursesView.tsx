
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  estimated_duration_hours: number | null;
  difficulty_level: string | null;
}

interface CoursesViewProps {
  courses: Course[] | undefined;
}

export function CoursesView({ courses }: CoursesViewProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Courses</h1>
        <p className="text-muted-foreground">Interactive learning courses</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No courses available for your subscription tier.</p>
          </div>
        )}
      </div>
    </div>
  );
}
