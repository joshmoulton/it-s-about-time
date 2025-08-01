import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RolePermission {
  id: string;
  role: string;
  permission_name: string;
  permission_category: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_admin: boolean;
}

export function RolePermissionsManagement() {
  const { toast } = useToast();
  const [editingPermissions, setEditingPermissions] = useState<Record<string, RolePermission>>({});
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Debug authentication status
  React.useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: authDebug } = await supabase.rpc('debug_current_auth_state');
        setDebugInfo(authDebug);
        console.log('🔍 Auth Debug Info:', authDebug);
      } catch (error) {
        console.error('Debug auth error:', error);
      }
    };
    checkAuthStatus();
  }, []);

  const { data: rolePermissions, isLoading, error, refetch } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      console.log('🔍 Fetching role permissions...');
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true })
        .order('permission_category', { ascending: true })
        .order('permission_name', { ascending: true });
        
      if (error) {
        console.error('❌ Role permissions query error:', error);
        throw error;
      }
      console.log('✅ Role permissions data:', data);
      return data as RolePermission[];
    }
  });

  const updatePermissions = useMutation({
    mutationFn: async (permissions: RolePermission[]) => {
      const updates = permissions.map(permission => 
        supabase
          .from('role_permissions')
          .update({
            can_read: permission.can_read,
            can_write: permission.can_write,
            can_delete: permission.can_delete,
            can_admin: permission.can_admin
          })
          .eq('id', permission.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} permissions`);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
      setEditingPermissions({});
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    }
  });

  const handlePermissionChange = (permission: RolePermission, field: keyof RolePermission, value: boolean) => {
    setEditingPermissions(prev => ({
      ...prev,
      [permission.id]: {
        ...permission,
        ...prev[permission.id],
        [field]: value
      }
    }));
  };

  const getEffectivePermission = (permission: RolePermission) => {
    return editingPermissions[permission.id] || permission;
  };

  const hasChanges = Object.keys(editingPermissions).length > 0;

  const saveChanges = () => {
    const changedPermissions = Object.values(editingPermissions);
    updatePermissions.mutate(changedPermissions);
  };

  const resetChanges = () => {
    setEditingPermissions({});
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: 'bg-red-500',
      admin: 'bg-blue-500',
      editor: 'bg-green-500',
      analyst: 'bg-purple-500',
      premium_user: 'bg-orange-500',
    };
    return (
      <Badge className={`text-white text-xs ${colors[role as keyof typeof colors] || 'bg-gray-500'}`}>
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const groupedPermissions = rolePermissions?.reduce((acc, permission) => {
    if (!acc[permission.role]) {
      acc[permission.role] = {};
    }
    if (!acc[permission.role][permission.permission_category]) {
      acc[permission.role][permission.permission_category] = [];
    }
    acc[permission.role][permission.permission_category].push(permission);
    return acc;
  }, {} as Record<string, Record<string, RolePermission[]>>) || {};

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Permissions Management</h1>
          <p className="text-muted-foreground">Configure permissions for each user role</p>
          {debugInfo && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
              <strong>Debug Info:</strong> 
              <span className="ml-2">Email: {debugInfo.current_email || 'None'}</span>
              <span className="ml-2">Admin: {debugInfo.is_admin ? 'Yes' : 'No'}</span>
              <span className="ml-2">Auth UID: {debugInfo.auth_uid || 'None'}</span>
            </div>
          )}
          {error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              <strong>Error:</strong> {error.message}
            </div>
          )}
          {isLoading && (
            <div className="mt-2 text-sm text-gray-500">Loading role permissions...</div>
          )}
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetChanges}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveChanges} disabled={updatePermissions.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updatePermissions.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {!rolePermissions || rolePermissions.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            {isLoading ? 'Loading permissions...' : 'No role permissions found'}
          </h3>
          <p className="text-muted-foreground">
            {error 
              ? 'Access denied. Please ensure you are logged in as an admin.'
              : isLoading 
                ? 'Please wait while we load the role permissions.'
                : 'Role permissions will appear here when they are configured.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedPermissions).map(([role, categories]) => (
            <Card key={role}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {getRoleBadge(role)}
                  <span className="ml-2">Permissions</span>
                </CardTitle>
                <CardDescription>
                  Configure what users with the {role.replace('_', ' ')} role can access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(categories).map(([category, permissions]) => (
                    <div key={category}>
                      <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
                        {category.replace('_', ' ')}
                      </h4>
                      <div className="space-y-3">
                        {permissions.map((permission) => {
                          const effective = getEffectivePermission(permission);
                          return (
                            <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{permission.permission_name.replace('_', ' ')}</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={effective.can_read}
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(permission, 'can_read', checked)
                                    }
                                  />
                                  <span className="text-xs">Read</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={effective.can_write}
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(permission, 'can_write', checked)
                                    }
                                  />
                                  <span className="text-xs">Write</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={effective.can_delete}
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(permission, 'can_delete', checked)
                                    }
                                  />
                                  <span className="text-xs">Delete</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={effective.can_admin}
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(permission, 'can_admin', checked)
                                    }
                                  />
                                  <span className="text-xs">Admin</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}