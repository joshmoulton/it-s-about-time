import React, { useState } from 'react';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Eye, TrendingUp, TrendingDown, DollarSign, User, MessageSquare, AlertTriangle, Clock } from 'lucide-react';
import { submitAlert, validatePhoneNumber, validatePositionLogic, type AlertSubmission, type TimeCondition, type AlertResponse } from '@/lib/api/alertSubmission';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AlertFormData {
  coin: string;
  entry_price: number;
  target_price?: number;
  stop_loss_price?: number;
  trading_type: 'spot' | 'futures';
  position_type: 'long' | 'short';
  caller: string;
  note?: string;
}

export function SignalGeneratorForm() {
  const { currentUser } = useEnhancedAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [timeConditions, setTimeConditions] = useState<TimeCondition[]>([]);
  
  const [formData, setFormData] = useState<AlertFormData>({
    coin: '',
    entry_price: 0,
    target_price: undefined,
    stop_loss_price: undefined,
    trading_type: 'spot',
    position_type: 'long',
    caller: 'Foxy',
    note: ''
  });

  const updateFormData = (updates: Partial<AlertFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    setValidationErrors([]);
    setValidationWarnings([]);

    // Basic validation
    if (!formData.coin.trim()) errors.push('Coin symbol is required');
    if (!formData.entry_price || formData.entry_price <= 0) errors.push('Entry price must be positive');
    if (!formData.caller) errors.push('Caller/analyst name is required');

    // Position logic validation
    const positionValidation = validatePositionLogic(
      formData.entry_price,
      formData.target_price,
      formData.stop_loss_price,
      formData.position_type
    );
    
    if (!positionValidation.isValid) {
      errors.push(...positionValidation.errors);
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }

    return true;
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!currentUser) {
      toast.error('You must be logged in to create alerts');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get API key from Supabase secrets
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
        trading_type: formData.trading_type,
        caller: formData.caller,
        note: formData.note,
        user_id: currentUser.id,
        time_conditions: timeConditions.length > 0 ? timeConditions : undefined
      };

      const result: AlertResponse = await submitAlert(alertData, secrets.value);
      
      if (result.success) {
        toast.success(`Alert created successfully! ID: ${result.alert_id}`);
        
        // Display warnings if any
        if (result.warnings && result.warnings.length > 0) {
          setValidationWarnings(result.warnings);
        }
        
        // Reset form
        setFormData({
          coin: '',
          entry_price: 0,
          target_price: undefined,
          stop_loss_price: undefined,
          trading_type: 'spot',
          position_type: 'long',
          caller: 'Foxy',
          note: ''
        });
        setTimeConditions([]);
        setValidationErrors([]);
        setValidationWarnings([]);
      } else {
        setValidationErrors(result.errors || ['Unknown error']);
        if (result.warnings) setValidationWarnings(result.warnings);
      }
      
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error(`Failed to create alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewContent = `
🚨 TRADING ALERT 🚨

💎 ${formData.coin.toUpperCase()} ${formData.trading_type.toUpperCase()} ${formData.position_type.toUpperCase()}

🎯 Entry: $${formData.entry_price}
${formData.target_price ? `🚀 Target: $${formData.target_price}` : ''}
${formData.stop_loss_price ? `❌ Stop Loss: $${formData.stop_loss_price}` : ''}

📋 Analyst: ${formData.caller}
${timeConditions.length > 0 ? `⏰ Time Conditions: ${timeConditions[0].config.timeframe} candle close` : ''}

${formData.note ? `📝 Notes: ${formData.note}` : ''}

⚠️ Trade at your own risk - Not financial advice!
  `;

  return (
    <>
      <div className="h-full overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Create Trading Alert</h2>
            <p className="text-muted-foreground">Generate professional trading alerts for your external dashboard</p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Analyst Information */}
            <ModernCard variant="elevated" className="lg:col-span-1">
              <ModernCardHeader className="pb-4">
                <ModernCardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-brand-primary" />
                  Analyst
                </ModernCardTitle>
              </ModernCardHeader>
              <ModernCardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Caller/Analyst Name</Label>
                  <Select value={formData.caller} onValueChange={(value) => updateFormData({ caller: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select analyst" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Foxy">Foxy</SelectItem>
                      <SelectItem value="Pidgeon">Pidgeon</SelectItem>
                      <SelectItem value="Daniel">Daniel</SelectItem>
                      <SelectItem value="Wiz">Wiz</SelectItem>
                      <SelectItem value="Abe">Abe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </ModernCardContent>
            </ModernCard>

            {/* Quick Stats */}
            <ModernCard variant="elevated" className="lg:col-span-1">
              <ModernCardHeader className="pb-4">
                <ModernCardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-brand-primary" />
                  Alert Stats
                </ModernCardTitle>
              </ModernCardHeader>
              <ModernCardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-brand-primary">
                      {formData.target_price ? '1' : '0'}
                    </div>
                    <div className="text-xs text-muted-foreground">Target</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-brand-primary">
                      {formData.position_type === 'long' ? '📈' : '📉'}
                    </div>
                    <div className="text-xs text-muted-foreground">Position</div>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>
          </div>

          {/* Trade Details */}
          <ModernCard variant="elevated">
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-brand-primary" />
                Trade Details
              </ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent className="space-y-6">
              {/* Primary Trade Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Coin Symbol</Label>
                  <Input
                    value={formData.coin}
                    onChange={e => updateFormData({ coin: e.target.value.toUpperCase() })}
                    placeholder="BTC, ETH, SOL"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Trading Type</Label>
                  <Select 
                    value={formData.trading_type} 
                    onValueChange={(value: 'spot' | 'futures') => updateFormData({ trading_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spot">Spot Trading</SelectItem>
                      <SelectItem value="futures">Futures Trading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Position Type</Label>
                  <Select 
                    value={formData.position_type} 
                    onValueChange={(value: 'long' | 'short') => updateFormData({ position_type: value })}
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

              {/* Price Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Entry Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.entry_price || ''}
                    onChange={e => updateFormData({ entry_price: parseFloat(e.target.value) || 0 })}
                    placeholder="45000.00"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Target Price (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.target_price || ''}
                    onChange={e => updateFormData({ target_price: parseFloat(e.target.value) || undefined })}
                    placeholder="50000.00"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Stop Loss (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.stop_loss_price || ''}
                    onChange={e => updateFormData({ stop_loss_price: parseFloat(e.target.value) || undefined })}
                    placeholder="40000.00"
                  />
                </div>
              </div>

            </ModernCardContent>
          </ModernCard>

          {/* Analysis Notes */}
          <ModernCard variant="elevated">
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand-primary" />
                Analysis Notes
              </ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent>
              <Textarea
                value={formData.note || ''}
                onChange={e => updateFormData({ note: e.target.value })}
                placeholder="Add your analysis, reasoning, or additional context for the trade..."
                className="min-h-[120px]"
              />
            </ModernCardContent>
          </ModernCard>

          {/* Time Conditions */}
          <ModernCard variant="elevated">
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-primary" />
                Time Conditions
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="candlestick-close"
                  checked={timeConditions.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setTimeConditions([{
                        type: 'candlestick_close',
                        enabled: true,
                        config: { timeframe: '1h', waitForClose: true }
                      }]);
                    } else {
                      setTimeConditions([]);
                    }
                  }}
                />
                <Label htmlFor="candlestick-close" className="text-sm font-medium">
                  Wait for candlestick close
                </Label>
              </div>
              
              {timeConditions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Timeframe</Label>
                  <Select
                    value={timeConditions[0]?.config.timeframe || '1h'}
                    onValueChange={(value) => {
                      setTimeConditions([{
                        ...timeConditions[0],
                        config: { ...timeConditions[0].config, timeframe: value }
                      }]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 Minute</SelectItem>
                      <SelectItem value="5m">5 Minutes</SelectItem>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="30m">30 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="2h">2 Hours</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="6h">6 Hours</SelectItem>
                      <SelectItem value="8h">8 Hours</SelectItem>
                      <SelectItem value="12h">12 Hours</SelectItem>
                      <SelectItem value="1d">1 Day</SelectItem>
                      <SelectItem value="3d">3 Days</SelectItem>
                      <SelectItem value="1w">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </ModernCardContent>
          </ModernCard>

          {/* Validation Errors and Warnings */}
          {validationErrors.length > 0 && (
            <ModernCard variant="elevated" className="border-red-200 bg-red-50">
              <ModernCardHeader>
                <ModernCardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Validation Errors
                </ModernCardTitle>
              </ModernCardHeader>
              <ModernCardContent>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i} className="text-sm text-red-600">{error}</li>
                  ))}
                </ul>
              </ModernCardContent>
            </ModernCard>
          )}

          {validationWarnings.length > 0 && (
            <ModernCard variant="elevated" className="border-amber-200 bg-amber-50">
              <ModernCardHeader>
                <ModernCardTitle className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  Warnings
                </ModernCardTitle>
              </ModernCardHeader>
              <ModernCardContent>
                <ul className="list-disc list-inside space-y-1">
                  {validationWarnings.map((warning, i) => (
                    <li key={i} className="text-sm text-amber-600">{warning}</li>
                  ))}
                </ul>
              </ModernCardContent>
            </ModernCard>
          )}

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 -mx-4 border-t">
            <div className="flex gap-4">
              <Button 
                onClick={handlePreview} 
                size="lg" 
                variant="outline"
                className="flex-1" 
                disabled={!formData.coin || !formData.entry_price || !formData.caller}
              >
                <Eye className="h-5 w-5 mr-2" />
                Preview Alert
              </Button>
              
              <Button 
                onClick={handleSubmit} 
                size="lg" 
                className="flex-1 bg-brand-primary hover:bg-brand-primary/90" 
                disabled={isSubmitting || !formData.coin || !formData.entry_price || !formData.caller}
              >
                <Send className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Alert'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-brand-primary" />
              Alert Preview
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">{previewContent}</pre>
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                This alert will be sent to your external trading dashboard
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}