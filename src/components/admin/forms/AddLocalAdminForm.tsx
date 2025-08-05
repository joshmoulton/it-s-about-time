
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { logger } from '@/utils/secureLogger';

interface AddLocalAdminFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  password: string;
  role: string;
}

export function AddLocalAdminForm({ onCancel, onSuccess }: AddLocalAdminFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      role: 'admin'
    }
  });

  const createLocalAdmin = useMutation({
    mutationFn: async ({ email, password, role }: FormData) => {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found');
      }

      // Call the edge function to create the admin user
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: email.toLowerCase().trim(),
          password,
          role
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        logger.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create admin user');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create admin user');
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Admin user ${data.user.email} created successfully with role: ${data.user.role}`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      logger.error('Error creating admin user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: FormData) => {
    createLocalAdmin.mutate(data);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to User Management
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Admin User</h1>
          <p className="text-muted-foreground">Create a local admin user with Supabase authentication</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Admin User
          </CardTitle>
          <CardDescription>
            Create a new admin user with local Supabase authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Secure password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Admin Role</Label>
              <Select value={watch('role')} onValueChange={(value) => setValue('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background border shadow-lg">
                  <SelectItem value="premium_user">Premium User</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createLocalAdmin.isPending}>
                {createLocalAdmin.isPending ? 'Creating...' : 'Create Admin User'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
