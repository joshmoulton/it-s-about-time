
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Plus, 
  Upload, 
  BookOpen, 
  Play, 
  FileText, 
  Clock, 
  Users, 
  Star,
  Trash2,
  GripVertical,
  Eye
} from 'lucide-react';

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructor_name: z.string().min(2, 'Instructor name is required'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  required_tier: z.enum(['free', 'paid', 'premium']),
  status: z.enum(['draft', 'published', 'archived']),
  price_cents: z.number().min(0),
  estimated_duration_hours: z.number().min(0.5),
  tags: z.array(z.string()).optional(),
  thumbnail_url: z.string().url().optional().or(z.literal(''))
});

const moduleSchema = z.object({
  title: z.string().min(2, 'Module title is required'),
  description: z.string().optional(),
  order_index: z.number(),
  lessons: z.array(z.object({
    title: z.string().min(2, 'Lesson title is required'),
    description: z.string().optional(),
    content_type: z.enum(['video', 'text', 'quiz', 'assignment']),
    content_url: z.string().optional(),
    content_text: z.string().optional(),
    estimated_duration_minutes: z.number().min(1),
    is_preview: z.boolean(),
    order_index: z.number()
  }))
});

type CourseFormData = z.infer<typeof courseSchema>;
type ModuleData = z.infer<typeof moduleSchema>;

interface CreateCourseFormProps {
  onCancel: () => void;
}

export function CreateCourseForm({ onCancel }: CreateCourseFormProps) {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [currentStep, setCurrentStep] = useState<'course' | 'modules'>('course');
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      instructor_name: '',
      difficulty_level: 'beginner',
      required_tier: 'free',
      status: 'draft',
      price_cents: 0,
      estimated_duration_hours: 1,
      tags: [],
      thumbnail_url: ''
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData & { modules: ModuleData[] }) => {
      // Create course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: data.title,
          description: data.description,
          instructor_name: data.instructor_name,
          difficulty_level: data.difficulty_level,
          required_tier: data.required_tier,
          status: data.status,
          price_cents: data.price_cents,
          estimated_duration_hours: data.estimated_duration_hours,
          tags: data.tags,
          thumbnail_url: data.thumbnail_url || null
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Create modules and lessons
      for (const moduleData of data.modules) {
        const { data: module, error: moduleError } = await supabase
          .from('course_modules')
          .insert({
            course_id: course.id,
            title: moduleData.title,
            description: moduleData.description,
            order_index: moduleData.order_index,
            content_type: 'module'
          })
          .select()
          .single();

        if (moduleError) throw moduleError;

        // Create lessons for this module
        for (const lesson of moduleData.lessons) {
          const { error: lessonError } = await supabase
            .from('course_modules')
            .insert({
              course_id: course.id,
              title: lesson.title,
              description: lesson.description,
              content_type: lesson.content_type,
              content_url: lesson.content_url,
              content_text: lesson.content_text,
              estimated_duration_minutes: lesson.estimated_duration_minutes,
              is_preview: lesson.is_preview,
              order_index: lesson.order_index
            });

          if (lessonError) throw lessonError;
        }
      }

      return course;
    },
    onSuccess: () => {
      toast({
        title: "Course created successfully!",
        description: "Your course has been created and saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      onCancel();
    },
    onError: (error) => {
      toast({
        title: "Error creating course",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: CourseFormData) => {
    createCourseMutation.mutate({ ...data, modules });
  };

  const addTag = () => {
    if (tagInput.trim() && !form.getValues('tags')?.includes(tagInput.trim())) {
      const currentTags = form.getValues('tags') || [];
      form.setValue('tags', [...currentTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const addModule = () => {
    const newModule: ModuleData = {
      title: `Module ${modules.length + 1}`,
      description: '',
      order_index: modules.length,
      lessons: []
    };
    setModules([...modules, newModule]);
  };

  const addLesson = (moduleIndex: number) => {
    const updatedModules = [...modules];
    const newLesson = {
      title: `Lesson ${updatedModules[moduleIndex].lessons.length + 1}`,
      description: '',
      content_type: 'video' as const,
      content_url: '',
      content_text: '',
      estimated_duration_minutes: 10,
      is_preview: false,
      order_index: updatedModules[moduleIndex].lessons.length
    };
    updatedModules[moduleIndex].lessons.push(newLesson);
    setModules(updatedModules);
  };

  const removeModule = (moduleIndex: number) => {
    setModules(modules.filter((_, index) => index !== moduleIndex));
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex);
    setModules(updatedModules);
  };

  if (currentStep === 'modules') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('course')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Course Modules & Lessons</h2>
              <p className="text-muted-foreground">Structure your course content</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={() => onSubmit(form.getValues())}
              disabled={createCourseMutation.isPending}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-4">
          {modules.map((module, moduleIndex) => (
            <Card key={moduleIndex} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <BookOpen className="h-5 w-5 text-brand-primary" />
                    <Input
                      value={module.title}
                      onChange={(e) => {
                        const updatedModules = [...modules];
                        updatedModules[moduleIndex].title = e.target.value;
                        setModules(updatedModules);
                      }}
                      className="font-semibold border-none p-0 h-auto bg-transparent"
                      placeholder="Module title"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeModule(moduleIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={module.description}
                  onChange={(e) => {
                    const updatedModules = [...modules];
                    updatedModules[moduleIndex].description = e.target.value;
                    setModules(updatedModules);
                  }}
                  placeholder="Module description (optional)"
                  className="mt-2"
                  rows={2}
                />
              </CardHeader>
              <CardContent>
                {/* Lessons */}
                <div className="space-y-3">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lessonIndex} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      {lesson.content_type === 'video' && <Play className="h-4 w-4 text-blue-500" />}
                      {lesson.content_type === 'text' && <FileText className="h-4 w-4 text-green-500" />}
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <Input
                          value={lesson.title}
                          onChange={(e) => {
                            const updatedModules = [...modules];
                            updatedModules[moduleIndex].lessons[lessonIndex].title = e.target.value;
                            setModules(updatedModules);
                          }}
                          placeholder="Lesson title"
                          className="col-span-2"
                        />
                        <Select
                          value={lesson.content_type}
                          onValueChange={(value: 'video' | 'text' | 'quiz' | 'assignment') => {
                            const updatedModules = [...modules];
                            updatedModules[moduleIndex].lessons[lessonIndex].content_type = value;
                            setModules(updatedModules);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="text">Article</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={lesson.estimated_duration_minutes}
                            onChange={(e) => {
                              const updatedModules = [...modules];
                              updatedModules[moduleIndex].lessons[lessonIndex].estimated_duration_minutes = parseInt(e.target.value) || 0;
                              setModules(updatedModules);
                            }}
                            placeholder="Duration (min)"
                            className="w-20"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLesson(moduleIndex, lessonIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    onClick={() => addLesson(moduleIndex)}
                    className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-solid"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            onClick={addModule}
            className="w-full h-16 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-solid"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Module
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Create New Course</h2>
            <p className="text-muted-foreground">Build an engaging learning experience</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={() => setCurrentStep('modules')}
            className="bg-brand-primary hover:bg-brand-primary/90"
          >
            Continue to Modules
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-brand-primary" />
                    Course Details
                  </CardTitle>
                  <CardDescription>
                    Basic information about your course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter an engaging course title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what students will learn and achieve..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0} characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="instructor_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructor Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimated_duration_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.5"
                              placeholder="2.5"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-primary" />
                    Course Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="difficulty_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="required_tier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Tier</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="price_cents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value) * 100) || 0)}
                            value={field.value ? (field.value / 100).toFixed(2) : ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Set to 0 for free courses
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags */}
                  <div className="space-y-2">
                    <FormLabel>Tags</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.watch('tags')?.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-xs"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Course Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {form.watch('title') || 'Course Title'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  by {form.watch('instructor_name') || 'Instructor'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {form.watch('estimated_duration_hours') || 0}h
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {form.watch('difficulty_level') || 'beginner'}
                </div>
              </div>
              <p className="text-sm">
                {form.watch('description') || 'Course description will appear here...'}
              </p>
              <div className="flex flex-wrap gap-1">
                {form.watch('tags')?.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              {form.watch('price_cents') > 0 && (
                <div className="text-lg font-bold text-brand-primary">
                  ${(form.watch('price_cents') / 100).toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
