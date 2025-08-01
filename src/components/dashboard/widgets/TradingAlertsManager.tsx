
import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Settings, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { submitAlert, type AlertSubmission } from '@/lib/api/alertSubmission';
import { AlertManagementDashboard } from '@/components/admin/AlertManagementDashboard';
import { toast } from 'sonner';

interface TradingAlert {
  coin: string;
  entry_price: number;
  target_price?: number;
  stop_loss_price?: number;
  position_type: 'long' | 'short';
  caller: string;
  note?: string;
  phone_number: string;
}

export function TradingAlertsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<TradingAlert>({
    coin: '',
    entry_price: 0,
    target_price: undefined,
    stop_loss_price: undefined,
    position_type: 'long',
    caller: 'Research Team',
    note: '',
    phone_number: '+1234567890' // Default - should be configurable
  });
  const { currentUser } = useEnhancedAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('You must be logged in to create alerts');
      return;
    }

    setIsLoading(true);
    try {
      // Get API key from Supabase secrets or environment
      const { data: secrets } = await supabase.functions.invoke('get-secret', {
        body: { name: 'ALERT_API_KEY' }
      });

      if (!secrets?.value) {
        throw new Error('Alert API key not configured. Please configure the API key in settings.');
      }

      // Submit to external alert API
      const alertData: AlertSubmission = {
        coin: formData.coin.toUpperCase(),
        entry_price: formData.entry_price,
        target_price: formData.target_price,
        stop_loss_price: formData.stop_loss_price,
        position_type: formData.position_type,
        caller: formData.caller,
        note: formData.note,
        user_id: currentUser.id
      };

      const result = await submitAlert(alertData, secrets.value);
      
      toast.success(`Alert created successfully! ID: ${result.alert_id}`);
      setIsOpen(false);
      setFormData({
        coin: '',
        entry_price: 0,
        target_price: undefined,
        stop_loss_price: undefined,
        position_type: 'long',
        caller: 'Research Team',
        note: '',
        phone_number: '+1234567890'
      });
    } catch (error) {
      console.error('Error creating trading alert:', error);
      toast.error(`Failed to create alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Manage Alerts
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Alert
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage">
          <AlertManagementDashboard />
        </TabsContent>
        
        <TabsContent value="create">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Create New Alert</h3>
                <p className="text-sm text-muted-foreground">
                  Create a new trading alert with entry, target, and stop loss parameters
                </p>
              </div>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Alert
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Create Trading Alert
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="coin">Coin Symbol</Label>
                      <Input
                        id="coin"
                        placeholder="e.g., BTC, ETH, SOL"
                        value={formData.coin}
                        onChange={(e) => setFormData(prev => ({ ...prev, coin: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="entry_price">Entry Price</Label>
                        <Input
                          id="entry_price"
                          type="number"
                          step="0.01"
                          placeholder="45000.00"
                          value={formData.entry_price || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, entry_price: parseFloat(e.target.value) || 0 }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="target_price">Target Price (Optional)</Label>
                        <Input
                          id="target_price"
                          type="number"
                          step="0.01"
                          placeholder="50000.00"
                          value={formData.target_price || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, target_price: parseFloat(e.target.value) || undefined }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stop_loss_price">Stop Loss (Optional)</Label>
                        <Input
                          id="stop_loss_price"
                          type="number"
                          step="0.01"
                          placeholder="40000.00"
                          value={formData.stop_loss_price || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, stop_loss_price: parseFloat(e.target.value) || undefined }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="position_type">Position Type</Label>
                        <Select 
                          value={formData.position_type} 
                          onValueChange={(value: 'long' | 'short') => setFormData(prev => ({ ...prev, position_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="long">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                Long
                              </div>
                            </SelectItem>
                            <SelectItem value="short">
                              <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-500" />
                                Short
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="caller">Caller/Analyst</Label>
                        <Input
                          id="caller"
                          placeholder="Research Team"
                          value={formData.caller}
                          onChange={(e) => setFormData(prev => ({ ...prev, caller: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          placeholder="+1234567890"
                          value={formData.phone_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="note">Analysis Notes (Optional)</Label>
                      <Textarea
                        id="note"
                        placeholder="Add your analysis or trading notes here..."
                        value={formData.note || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Alert'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
