
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, BookOpen, Calendar, Users, Eye, GraduationCap } from 'lucide-react';
import { CourseCreation } from './CourseCreation';

export function CourseManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredCourses = courses?.filter(course =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'draft': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'archived': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-400';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-400';
      case 'advanced': return 'bg-red-500/10 text-red-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  if (showCreateForm) {
    return <CourseCreation onCancel={() => setShowCreateForm(false)} />;
  }

  return (
    <div className="space-y-6 p-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Course Management</h1>
          <p className="text-slate-400">Create and manage educational courses</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{courses?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {courses?.filter(c => c.status === 'published').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {courses?.filter(c => c.status === 'draft').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Search Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <Card className="border border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <GraduationCap className="h-5 w-5 text-orange-400" />
            Courses ({filteredCourses.length})
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your educational course library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-slate-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No courses found</h3>
              <p className="text-slate-400 mb-4">
                {searchTerm ? 'No courses match your search.' : 'Get started by creating your first course.'}
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-slate-700/30 rounded-lg border border-slate-600/50 overflow-hidden hover:bg-slate-600/30 transition-colors">
                  <div className="aspect-video bg-slate-800 relative">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title || 'Course thumbnail'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap className="h-12 w-12 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className={getStatusColor(course.status || 'draft')}>
                        {course.status || 'draft'}
                      </Badge>
                    </div>
                    {course.difficulty_level && (
                      <div className="absolute top-2 right-2">
                        <Badge className={getDifficultyColor(course.difficulty_level)}>
                          {course.difficulty_level}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">
                      {course.title || 'Untitled Course'}
                    </h3>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                      {course.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(course.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        0 lessons
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-slate-300 border-slate-600">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-slate-300 border-slate-600">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
