import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Loader2, UserPlus } from 'lucide-react';

type AppRole = Database['public']['Enums']['app_role'];

interface AddLocalUserFormProps {
  onSuccess?: () => void;
}

export const AddLocalUserForm: React.FC<AddLocalUserFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    email: string;
    role: AppRole | '';
    temporaryPassword: string;
  }>({
    email: '',
    role: '',
    temporaryPassword: ''
  });
  const { toast } = useToast();

  const roleOptions: Array<{value: AppRole, label: string, description: string}> = [
    { value: 'user', label: 'User', description: 'Basic dashboard access' },
    { value: 'analyst', label: 'Analyst', description: 'Full premium dashboard access' },
    { value: 'admin', label: 'Admin', description: 'Signal creation and management only' },
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access' }
  ];

  const generateTemporaryPassword = () => {
    const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    setFormData(prev => ({ ...prev, temporaryPassword: password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Creating local user via edge function...');
      
      // Call the edge function to create the user
      const { data, error } = await supabase.functions.invoke('create-local-user', {
        body: {
          email: formData.email,
          role: formData.role,
          temporaryPassword: formData.temporaryPassword
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to create user: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create user');
      }

      toast({
        title: "Success!",
        description: `Local user created successfully with ${formData.role} role. Temporary password: ${data.temporaryPassword}`,
      });

      // Reset form
      setFormData({ email: '', role: '', temporaryPassword: '' });
      onSuccess?.();
    } catch (error) {
      console.error('Error creating local user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add Local User
        </CardTitle>
        <CardDescription>
          Create a new local user account with specific role permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as AppRole | '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-sm text-muted-foreground">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temporaryPassword">Temporary Password (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="temporaryPassword"
                type="text"
                value={formData.temporaryPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, temporaryPassword: e.target.value }))}
                placeholder="Leave empty to auto-generate"
              />
              <Button type="button" variant="outline" onClick={generateTemporaryPassword}>
                Generate
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              If left empty, a secure password will be automatically generated
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating User...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Local User
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};