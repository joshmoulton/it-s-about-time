import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Search, Clock, User, AlertTriangle } from 'lucide-react';
import { adminSecurityManager } from '@/utils/adminSecurity';
import { maskEmail } from '@/utils/dataMasking';
import { logger } from '@/utils/secureLogger';

interface AuditEvent {
  id: string;
  action: string;
  resource: string;
  resource_id?: string;
  user_email: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export function AdminAuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const { data: auditEvents, isLoading } = useQuery({
    queryKey: ['admin-audit-events', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchTerm) {
        query = query.or(
          `action.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%,resource.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      
      if (error) {
        logger.error('Failed to fetch audit events:', error);
        throw error;
      }
      
      return data as AuditEvent[];
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const getActionBadge = (action: string) => {
    const colors = {
      session_start: 'bg-green-500',
      session_end: 'bg-gray-500',
      elevation_granted: 'bg-yellow-500',
      elevation_failed: 'bg-red-500',
      data_access: 'bg-blue-500',
      user_delete: 'bg-red-500',
      user_create: 'bg-green-500',
      user_update: 'bg-blue-500',
      admin_create: 'bg-purple-500',
      admin_delete: 'bg-red-500',
      account_locked: 'bg-red-500'
    };

    const color = colors[action as keyof typeof colors] || 'bg-gray-500';
    
    return (
      <Badge className={`text-white text-xs ${color}`}>
        {action.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getSeverityIcon = (action: string) => {
    const highRiskActions = ['user_delete', 'admin_delete', 'elevation_failed', 'account_locked'];
    
    if (highRiskActions.includes(action)) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    
    return <Shield className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Audit Log
        </CardTitle>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search actions, users, or resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading audit events...</p>
            </div>
          ) : auditEvents?.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit events found</p>
            </div>
          ) : (
            auditEvents?.map((event) => (
              <Dialog key={event.id}>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(event.action)}
                      <div>
                        <div className="flex items-center gap-2">
                          {getActionBadge(event.action)}
                          <span className="text-sm font-medium">{event.resource}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {maskEmail(event.user_email)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </DialogTrigger>
                
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {getSeverityIcon(event.action)}
                      Audit Event Details
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Action</label>
                        <div className="mt-1">{getActionBadge(event.action)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Resource</label>
                        <p className="text-sm mt-1">{event.resource}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">User</label>
                        <p className="text-sm mt-1">{maskEmail(event.user_email)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Timestamp</label>
                        <p className="text-sm mt-1">{new Date(event.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {event.resource_id && (
                      <div>
                        <label className="text-sm font-medium">Resource ID</label>
                        <p className="text-sm mt-1 font-mono">{event.resource_id}</p>
                      </div>
                    )}
                    
                    {event.ip_address && (
                      <div>
                        <label className="text-sm font-medium">IP Address</label>
                        <p className="text-sm mt-1 font-mono">{event.ip_address}</p>
                      </div>
                    )}
                    
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Metadata</label>
                        <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-h-40">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}