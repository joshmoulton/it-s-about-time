import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Settings, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setDataAccessQuota, type DataAccessQuota } from '@/utils/securityUtils';
import { supabase } from '@/integrations/supabase/client';

interface DataAccessQuotaManagerProps {
  quotas: DataAccessQuota[];
  onUpdate: () => void;
}

export const DataAccessQuotaManager: React.FC<DataAccessQuotaManagerProps> = ({
  quotas,
  onUpdate
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    resourceType: '',
    quotaLimit: 100,
    quotaPeriod: 'daily' as 'daily' | 'weekly' | 'monthly'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resourceTypes = [
    'user_data_export',
    'sensitive_data_view',
    'encrypted_data_view',
    'audit_log_access',
    'user_list_view',
    'subscriber_data_access'
  ];

  const handleSetQuota = async () => {
    if (!formData.resourceType) {
      toast({
        title: "Error",
        description: "Resource type is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('No authenticated user');
      }

      const success = await setDataAccessQuota(
        user.email,
        formData.resourceType,
        formData.quotaLimit,
        formData.quotaPeriod
      );

      if (success) {
        toast({
          title: "Success",
          description: "Data access quota has been set"
        });
        setShowAddDialog(false);
        setFormData({
          resourceType: '',
          quotaLimit: 100,
          quotaPeriod: 'daily'
        });
        onUpdate();
      } else {
        throw new Error('Failed to set quota');
      }
    } catch (error) {
      console.error('Failed to set quota:', error);
      toast({
        title: "Error",
        description: "Failed to set data access quota",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuota = async (id: string, newLimit: number) => {
    try {
      const { error } = await supabase
        .from('data_access_quotas')
        .update({ quota_limit: newLimit })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quota limit updated"
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update quota:', error);
      toast({
        title: "Error",
        description: "Failed to update quota",
        variant: "destructive"
      });
    }
  };

  const getQuotaStatus = (quota: DataAccessQuota) => {
    const usagePercent = (quota.quota_used / quota.quota_limit) * 100;
    
    if (usagePercent >= 100) return { label: 'Exceeded', color: 'bg-destructive' };
    if (usagePercent >= 80) return { label: 'High Usage', color: 'bg-warning' };
    if (usagePercent >= 50) return { label: 'Medium Usage', color: 'bg-primary' };
    return { label: 'Low Usage', color: 'bg-success' };
  };

  const isQuotaActive = (quota: DataAccessQuota) => {
    const now = new Date();
    return new Date(quota.period_start) <= now && new Date(quota.period_end) >= now;
  };

  return (
    <div className="space-y-4">
      {/* Add Quota Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Set New Quota
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Data Access Quota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select
                value={formData.resourceType}
                onValueChange={(value) => setFormData({ ...formData, resourceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quotaLimit">Quota Limit</Label>
              <Input
                id="quotaLimit"
                type="number"
                value={formData.quotaLimit}
                onChange={(e) => setFormData({ ...formData, quotaLimit: parseInt(e.target.value) || 0 })}
                min="1"
                max="10000"
              />
            </div>
            <div>
              <Label htmlFor="quotaPeriod">Quota Period</Label>
              <Select
                value={formData.quotaPeriod}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  setFormData({ ...formData, quotaPeriod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleSetQuota} disabled={loading}>
                {loading ? 'Setting...' : 'Set Quota'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quotas Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Data Access Quotas ({quotas.filter(q => isQuotaActive(q)).length} active)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quotas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data access quotas configured
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotas.map((quota) => {
                  const status = getQuotaStatus(quota);
                  const active = isQuotaActive(quota);
                  const usagePercent = (quota.quota_used / quota.quota_limit) * 100;
                  
                  return (
                    <TableRow key={quota.id} className={!active ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">
                        {quota.resource_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </TableCell>
                      <TableCell className="capitalize">
                        {quota.quota_period}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{quota.quota_used} / {quota.quota_limit}</span>
                            <span>{usagePercent.toFixed(1)}%</span>
                          </div>
                          <Progress value={usagePercent} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {usagePercent >= 100 && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(quota.period_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newLimit = prompt(
                                'Enter new quota limit:',
                                quota.quota_limit.toString()
                              );
                              if (newLimit && !isNaN(parseInt(newLimit))) {
                                updateQuota(quota.id, parseInt(newLimit));
                              }
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};