import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Edit, 
  Trash2, 
  Play, 
  Target, 
  StopCircle, 
  AlertTriangle, 
  CheckCircle,
  X,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  getAlerts, 
  updateAlertStatus, 
  updateAlertParameters, 
  deleteAlert,
  type AlertData,
  type AlertStatusOperation,
  type AlertUpdateParams 
} from '@/lib/api/alertManagement';

interface EditFormData {
  target_price?: number;
  stop_loss_price?: number;
  note?: string;
}

export function AlertManagementDashboard() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [editingAlert, setEditingAlert] = useState<AlertData | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({});

  // Fetch API key and alerts
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data: secrets } = await supabase.functions.invoke('get-secret', {
          body: { name: 'ALERT_API_KEY' }
        });
        
        if (secrets?.value) {
          setApiKey(secrets.value);
        } else {
          toast.error('Alert API key not configured');
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
        toast.error('Failed to fetch API key');
      }
    };

    fetchApiKey();
  }, []);

  // Load alerts when API key is available
  useEffect(() => {
    if (apiKey) {
      loadAlerts();
    }
  }, [apiKey]);

  const loadAlerts = async () => {
    if (!apiKey) return;
    
    setLoading(true);
    try {
      const filters = activeFilter === 'active' ? { active: true } : 
                    activeFilter === 'inactive' ? { active: false } : {};
      
      const response = await getAlerts(apiKey, filters);
      setAlerts(response.alerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (alertId: string, operation: AlertStatusOperation) => {
    try {
      await updateAlertStatus(alertId, operation, apiKey);
      toast.success(`Alert ${operation} successfully`);
      loadAlerts();
    } catch (error) {
      console.error('Error updating alert status:', error);
      toast.error(`Failed to ${operation} alert`);
    }
  };

  const handleParameterUpdate = async (alertId: string, params: AlertUpdateParams) => {
    try {
      await updateAlertParameters(alertId, params, apiKey);
      toast.success('Alert parameters updated successfully');
      setEditingAlert(null);
      setEditForm({});
      loadAlerts();
    } catch (error) {
      console.error('Error updating alert parameters:', error);
      toast.error('Failed to update alert parameters');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    
    try {
      await deleteAlert(alertId, apiKey);
      toast.success('Alert deleted successfully');
      loadAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    }
  };

  const getStatusBadge = (alert: AlertData) => {
    if (alert.invalidated) return <Badge variant="destructive">Invalidated</Badge>;
    if (alert.stopped_out) return <Badge variant="destructive">Stopped Out</Badge>;
    if (alert.triggered_at) return <Badge variant="default">Triggered</Badge>;
    if (alert.entry_activated) return <Badge variant="default">Entry Activated</Badge>;
    if (alert.is_active) return <Badge variant="secondary">Active</Badge>;
    return <Badge variant="outline">Inactive</Badge>;
  };

  const getStatusActions = (alert: AlertData) => {
    const actions: { label: string; operation: AlertStatusOperation; icon: React.ReactNode }[] = [];
    
    if (alert.is_active && !alert.entry_activated) {
      actions.push({
        label: 'Activate Entry',
        operation: 'entry_activated',
        icon: <Play className="h-4 w-4" />
      });
    }
    
    if (alert.entry_activated && !alert.triggered_at) {
      actions.push({
        label: 'Mark Triggered',
        operation: 'triggered',
        icon: <Target className="h-4 w-4" />
      });
    }
    
    if (alert.entry_activated && !alert.stopped_out) {
      actions.push({
        label: 'Mark Stopped Out',
        operation: 'stopped_out',
        icon: <StopCircle className="h-4 w-4" />
      });
    }
    
    if (!alert.invalidated) {
      actions.push({
        label: 'Invalidate',
        operation: 'invalidated',
        icon: <AlertTriangle className="h-4 w-4" />
      });
    }
    
    if (alert.invalidated) {
      actions.push({
        label: 'Validate',
        operation: 'validated',
        icon: <CheckCircle className="h-4 w-4" />
      });
    }
    
    if (alert.stopped_out) {
      actions.push({
        label: 'Reset Stopped Out',
        operation: 'reset_stopped_out',
        icon: <RotateCcw className="h-4 w-4" />
      });
    }
    
    return actions;
  };

  const openEditDialog = (alert: AlertData) => {
    setEditingAlert(alert);
    setEditForm({
      target_price: alert.target_price,
      stop_loss_price: alert.stop_loss_price,
      note: alert.note
    });
  };

  const handleEditSubmit = () => {
    if (!editingAlert) return;
    
    const params: AlertUpdateParams = {};
    if (editForm.target_price !== undefined) params.target_price = editForm.target_price;
    if (editForm.stop_loss_price !== undefined) params.stop_loss_price = editForm.stop_loss_price;
    if (editForm.note !== undefined) params.note = editForm.note;
    
    handleParameterUpdate(editingAlert.id, params);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Alert Management</h2>
        <div className="flex items-center gap-2">
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Alerts</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAlerts} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {alert.coin} {alert.position_type.toUpperCase()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(alert)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {getStatusActions(alert).map((action) => (
                        <DropdownMenuItem
                          key={action.operation}
                          onClick={() => handleStatusUpdate(alert.id, action.operation)}
                        >
                          {action.icon}
                          <span className="ml-2">{action.label}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onClick={() => openEditDialog(alert)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Parameters
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Entry Price</Label>
                  <div className="font-medium">${alert.entry_price}</div>
                </div>
                {alert.target_price && (
                  <div>
                    <Label className="text-muted-foreground">Target</Label>
                    <div className="font-medium">${alert.target_price}</div>
                  </div>
                )}
                {alert.stop_loss_price && (
                  <div>
                    <Label className="text-muted-foreground">Stop Loss</Label>
                    <div className="font-medium">${alert.stop_loss_price}</div>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Caller</Label>
                  <div className="font-medium">{alert.caller}</div>
                </div>
              </div>
              {alert.note && (
                <div className="mt-4">
                  <Label className="text-muted-foreground">Note</Label>
                  <div className="text-sm">{alert.note}</div>
                </div>
              )}
              <div className="mt-4 text-xs text-muted-foreground">
                Created: {new Date(alert.created_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No alerts found</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAlert} onOpenChange={() => setEditingAlert(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Alert Parameters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target_price">Target Price</Label>
              <Input
                id="target_price"
                type="number"
                step="0.01"
                value={editForm.target_price || ''}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  target_price: parseFloat(e.target.value) || undefined 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="stop_loss_price">Stop Loss Price</Label>
              <Input
                id="stop_loss_price"
                type="number"
                step="0.01"
                value={editForm.stop_loss_price || ''}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  stop_loss_price: parseFloat(e.target.value) || undefined 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={editForm.note || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingAlert(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit}>
                Update Alert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}