
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CourseHeaderProps {
  onCreateCourse: () => void;
}

export function CourseHeader({ onCreateCourse }: CourseHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Course Management</h1>
        <p className="text-muted-foreground">Create and manage educational courses</p>
      </div>
      <Button 
        className="bg-brand-primary hover:bg-brand-primary/90"
        onClick={onCreateCourse}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Course
      </Button>
    </div>
  );
}
