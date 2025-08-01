import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Shield, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addIPToAllowlist, type IPAllowlistEntry } from '@/utils/securityUtils';
import { supabase } from '@/integrations/supabase/client';

interface IPAllowlistManagerProps {
  allowlist: IPAllowlistEntry[];
  onUpdate: () => void;
  currentIP: string;
}

export const IPAllowlistManager: React.FC<IPAllowlistManagerProps> = ({
  allowlist,
  onUpdate,
  currentIP
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    ipAddress: '',
    subnetMask: 32,
    description: '',
    expiresAt: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddIP = async () => {
    if (!formData.ipAddress) {
      toast({
        title: "Error",
        description: "IP address is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get current admin email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('No authenticated user');
      }

      const success = await addIPToAllowlist(
        user.email,
        formData.ipAddress,
        formData.subnetMask,
        formData.description || undefined,
        formData.expiresAt || undefined
      );

      if (success) {
        toast({
          title: "Success",
          description: "IP address added to allowlist"
        });
        setShowAddDialog(false);
        setFormData({
          ipAddress: '',
          subnetMask: 32,
          description: '',
          expiresAt: ''
        });
        onUpdate();
      } else {
        throw new Error('Failed to add IP to allowlist');
      }
    } catch (error) {
      console.error('Failed to add IP:', error);
      toast({
        title: "Error",
        description: "Failed to add IP to allowlist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveIP = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_ip_allowlist')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "IP address removed from allowlist"
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to remove IP:', error);
      toast({
        title: "Error",
        description: "Failed to remove IP from allowlist",
        variant: "destructive"
      });
    }
  };

  const addCurrentIP = () => {
    setFormData({ ...formData, ipAddress: currentIP });
    setShowAddDialog(true);
  };

  const getIPStatus = (ip: IPAllowlistEntry) => {
    if (!ip.is_active) return { label: 'Inactive', color: 'bg-muted' };
    if (ip.expires_at && new Date(ip.expires_at) < new Date()) {
      return { label: 'Expired', color: 'bg-destructive' };
    }
    return { label: 'Active', color: 'bg-success' };
  };

  return (
    <div className="space-y-4">
      {/* Current IP Alert */}
      {currentIP && !allowlist.some(ip => ip.ip_address === currentIP && ip.is_active) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Your current IP ({currentIP}) is not allowlisted</span>
            <Button size="sm" onClick={addCurrentIP}>
              Add Current IP
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Add IP Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add IP Address
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP to Allowlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input
                id="ipAddress"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="192.168.1.100"
              />
            </div>
            <div>
              <Label htmlFor="subnetMask">Subnet Mask</Label>
              <Select
                value={formData.subnetMask.toString()}
                onValueChange={(value) => setFormData({ ...formData, subnetMask: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="32">32 (Single IP)</SelectItem>
                  <SelectItem value="24">24 (Class C - 256 IPs)</SelectItem>
                  <SelectItem value="16">16 (Class B - 65,536 IPs)</SelectItem>
                  <SelectItem value="8">8 (Class A - 16,777,216 IPs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Office network, VPN endpoint, etc."
              />
            </div>
            <div>
              <Label htmlFor="expiresAt">Expires At (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleAddIP} disabled={loading}>
                {loading ? 'Adding...' : 'Add IP'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* IP Allowlist Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Allowlisted IP Addresses ({allowlist.filter(ip => ip.is_active).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allowlist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No IP addresses in allowlist
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Subnet</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowlist.map((entry) => {
                  const status = getIPStatus(entry);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono">{entry.ip_address}</TableCell>
                      <TableCell>/{entry.subnet_mask}</TableCell>
                      <TableCell>{entry.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.expires_at 
                          ? new Date(entry.expires_at).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {entry.is_active && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveIP(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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