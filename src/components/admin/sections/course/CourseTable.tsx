
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, BookOpen, Users } from 'lucide-react';
import { format } from 'date-fns';

interface CourseTableProps {
  courses: any[] | undefined;
  isLoading: boolean;
}

export function CourseTable({ courses, isLoading }: CourseTableProps) {
  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-500',
      published: 'bg-green-500',
      archived: 'bg-red-500'
    };
    return (
      <Badge className={`text-white text-xs ${colors[status as keyof typeof colors] || 'bg-gray-500'}`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      free: 'bg-blue-500',
      paid: 'bg-purple-500',
      premium: 'bg-gold-500'
    };
    return (
      <Badge className={`text-white text-xs ${colors[tier as keyof typeof colors] || 'bg-gray-500'}`}>
        {tier.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-6 md:py-8 text-muted-foreground text-sm">Loading courses...</div>;
  }

  if (!courses || courses.length === 0) {
    return <div className="text-center py-6 md:py-8 text-muted-foreground text-sm">No courses created yet.</div>;
  }

  return (
    <div className="overflow-x-auto -mx-3 md:mx-0">
      <div className="min-w-full inline-block align-middle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs md:text-sm px-2 md:px-4">Title</TableHead>
              <TableHead className="text-xs md:text-sm px-2 md:px-4">Status</TableHead>
              <TableHead className="text-xs md:text-sm px-2 md:px-4 hidden md:table-cell">Required Tier</TableHead>
              <TableHead className="text-xs md:text-sm px-2 md:px-4 hidden lg:table-cell">Modules</TableHead>
              <TableHead className="text-xs md:text-sm px-2 md:px-4 hidden lg:table-cell">Duration</TableHead>
              <TableHead className="text-xs md:text-sm px-2 md:px-4 hidden lg:table-cell">Difficulty</TableHead>
              <TableHead className="text-xs md:text-sm px-2 md:px-4 hidden md:table-cell">Price</TableHead>
              <TableHead className="text-xs md:text-sm px-2 md:px-4 hidden lg:table-cell">Created</TableHead>
              <TableHead className="text-xs md:text-sm px-2 md:px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="px-2 md:px-4">
                  <div className="min-w-0">
                    <div className="font-medium text-xs md:text-sm truncate">{course.title}</div>
                    {course.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-32 md:max-w-none">
                        {course.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-2 md:px-4">{getStatusBadge(course.status)}</TableCell>
                <TableCell className="px-2 md:px-4 hidden md:table-cell">{getTierBadge(course.required_tier || 'free')}</TableCell>
                <TableCell className="px-2 md:px-4 hidden lg:table-cell">
                  <span className="text-xs md:text-sm">{course.course_modules?.[0]?.count || 0}</span>
                </TableCell>
                <TableCell className="px-2 md:px-4 hidden lg:table-cell">
                  <span className="text-xs md:text-sm">{course.estimated_duration_hours || 0}h</span>
                </TableCell>
                <TableCell className="px-2 md:px-4 hidden lg:table-cell">
                  <Badge variant="outline" className="text-xs">
                    {course.difficulty_level || 'beginner'}
                  </Badge>
                </TableCell>
                <TableCell className="px-2 md:px-4 hidden md:table-cell">
                  <span className="text-xs md:text-sm">
                    {course.price_cents ? `$${(course.price_cents / 100).toFixed(2)}` : 'Free'}
                  </span>
                </TableCell>
                <TableCell className="px-2 md:px-4 hidden lg:table-cell">
                  <span className="text-xs md:text-sm">
                    {format(new Date(course.created_at), 'MMM dd, yyyy')}
                  </span>
                </TableCell>
                <TableCell className="px-2 md:px-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="p-1 md:p-2">
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 md:p-2 hidden md:inline-flex">
                      <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 md:p-2 hidden md:inline-flex">
                      <Users className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
