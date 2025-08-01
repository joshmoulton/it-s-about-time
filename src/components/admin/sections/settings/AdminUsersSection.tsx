
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddLocalAdminForm } from '../../forms/AddLocalAdminForm';
import { useNavigate } from 'react-router-dom';
import { maskEmail, logDataAccess } from '@/utils/dataMasking';
import { adminSecurityManager } from '@/utils/adminSecurity';
import { logger } from '@/utils/secureLogger';

export function AdminUsersSection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  const { data: adminUsers, refetch: refetchAdmins } = useQuery({
    queryKey: ['admin-settings-users'],
    queryFn: async () => {
      console.log('Fetching admin users...');
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching admin users:', error);
        throw error;
      }
      
      console.log('Admin users fetched:', data?.length || 0, data);
      return data;
    }
  });

  const toggleAdminStatus = useMutation({
    mutationFn: async ({ adminId, isActive }: { adminId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: isActive })
        .eq('id', adminId);
      
      if (error) throw error;
      
      // Log the admin action
      await adminSecurityManager.auditLog(
        isActive ? 'activate_admin' : 'deactivate_admin',
        'admin_user',
        adminId
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin status updated successfully",
      });
      refetchAdmins();
    },
    onError: (error) => {
      logger.error('Failed to update admin status:', error);
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive",
      });
    }
  });

  const deleteAdmin = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);
      
      if (error) throw error;
      
      // Log the admin deletion
      await adminSecurityManager.auditLog(
        'delete_admin',
        'admin_user',
        adminId
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin user removed successfully",
      });
      refetchAdmins();
    },
    onError: (error) => {
      logger.error('Failed to remove admin user:', error);
      toast({
        title: "Error",
        description: "Failed to remove admin user",
        variant: "destructive",
      });
    }
  });

  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: 'bg-red-500',
      admin: 'bg-blue-500',
      editor: 'bg-green-500',
      analyst: 'bg-purple-500',
      premium_user: 'bg-orange-500',
      moderator: 'bg-yellow-500'
    };
    return (
      <Badge className={`text-white text-xs ${colors[role as keyof typeof colors] || 'bg-gray-500'}`}>
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getAdminEmail = (admin: any) => {
    // For standalone admins, use the direct email field
    if (admin.email) {
      return maskEmail(admin.email);
    }
    // For legacy subscriber-linked admins, use the subscriber email
    if (admin.beehiiv_subscribers?.email) {
      return maskEmail(admin.beehiiv_subscribers.email);
    }
    return 'No email available';
  };

  const getAdminType = (admin: any) => {
    if (admin.email && !admin.subscriber_id) {
      return 'Standalone';
    }
    if (admin.subscriber_id) {
      return 'Subscriber';
    }
    return admin.user_type || 'Unknown';
  };

  if (showAddAdmin) {
    return <AddLocalAdminForm onCancel={() => setShowAddAdmin(false)} onSuccess={() => {
      setShowAddAdmin(false);
      refetchAdmins();
    }} />;
  }


  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Users className="h-4 w-4 md:h-5 md:w-5" />
          Admin Users
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">Manage administrator accounts and permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        <div className="space-y-3 md:space-y-4">
          {adminUsers?.map((admin) => (
            <div key={admin.id} className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between p-3 md:p-4 border rounded-lg">
              <div className="flex items-center gap-2 md:gap-3">
                <Shield className="h-4 w-4 md:h-5 md:w-5 text-brand-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm md:text-base truncate">{getAdminEmail(admin)}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {getAdminType(admin)} • Added {new Date(admin.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:gap-3">
                {getRoleBadge(admin.role)}
                <div className="flex items-center justify-between md:justify-start md:gap-3">
                  <Switch 
                    checked={admin.is_active} 
                    onCheckedChange={(checked) => 
                      toggleAdminStatus.mutate({ adminId: admin.id, isActive: checked })
                    }
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/admin/edit-admin/${admin.id}`)}
                      className="text-xs"
                    >
                      <Edit2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteAdmin.mutate(admin.id)}
                      className="text-xs"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button 
          className="w-full text-xs md:text-sm"
          onClick={() => setShowAddAdmin(true)}
          size="sm"
        >
          <Plus className="h-3 w-3 md:h-4 md:w-4 mr-2" />
          Add New Admin
        </Button>
      </CardContent>
    </Card>
  );
}
