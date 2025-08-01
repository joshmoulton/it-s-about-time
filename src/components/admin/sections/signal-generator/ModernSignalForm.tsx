import React, { useState } from 'react';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Eye, TrendingUp, TrendingDown, DollarSign, User, MessageSquare, Target, Zap } from 'lucide-react';
import { useSignalGenerator } from '@/hooks/useSignalGenerator';

export function ModernSignalForm() {
  const { 
    formData, 
    updateFormData, 
    createSignal, 
    isCreating, 
    formattedOutput, 
    generatePreview,
    currentAdmin 
  } = useSignalGenerator();
  
  const [showPreview, setShowPreview] = useState(false);
  const [targets, setTargets] = useState<string[]>(['']);

  const addTarget = () => {
    setTargets([...targets, '']);
  };

  const removeTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const updateTarget = (index: number, value: string) => {
    const newTargets = [...targets];
    newTargets[index] = value;
    setTargets(newTargets);
  };

  const handlePreview = () => {
    const validTargets = targets.filter(t => t.trim());
    generatePreview({ ...formData, targets: validTargets });
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    const validTargets = targets.filter(t => t.trim());
    await createSignal({ ...formData, targets: validTargets });
    setTargets(['']);
  };

  const isAnalyst = currentAdmin?.role === 'analyst';
  const isAdmin = currentAdmin?.role === 'admin' || currentAdmin?.role === 'super_admin';

  return (
    <>
      <div className="h-full overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Create Trading Signal</h2>
            <p className="text-muted-foreground">Generate professional trading signals for your community</p>
          </div>

          {/* Analyst Information - Only show dropdown for admins */}
          {!isAnalyst && (
            <ModernCard variant="elevated">
              <ModernCardHeader className="pb-4">
                <ModernCardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-brand-primary" />
                  Analyst Information
                </ModernCardTitle>
              </ModernCardHeader>
              <ModernCardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Analyst/Caller Name</Label>
                  <Select 
                    value={formData.analystName} 
                    onValueChange={(value) => updateFormData({ analystName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select analyst" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Foxy">Foxy</SelectItem>
                      <SelectItem value="Pidgeon">Pidgeon</SelectItem>
                      <SelectItem value="CryptoWiz">Crypto Wiz</SelectItem>
                      <SelectItem value="DegenKing">Degen King</SelectItem>
                      <SelectItem value="TechAnalyst">Tech Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
              </ModernCardContent>
            </ModernCard>
          )}

          {isAnalyst && (
            <ModernCard variant="elevated">
              <ModernCardHeader className="pb-4">
                <ModernCardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-brand-primary" />
                  Analyst Information
                </ModernCardTitle>
              </ModernCardHeader>
              <ModernCardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Analyst/Caller Name</Label>
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <span className="text-sm font-medium">{formData.analystName}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">Auto-assigned</Badge>
                  </div>
                </div>
                
              </ModernCardContent>
            </ModernCard>
          )}

          {/* Market & Trade Details */}
          <ModernCard variant="elevated">
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
                Market & Trade Details
              </ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent className="space-y-6">
              {/* Market Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Market</Label>
                  <Select value={formData.market} onValueChange={(value) => updateFormData({ market: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="commodities">Commodities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Trade Type</Label>
                  <Select value={formData.tradeType} onValueChange={(value) => updateFormData({ tradeType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scalp">Scalp</SelectItem>
                      <SelectItem value="swing">Swing</SelectItem>
                      <SelectItem value="long_term">Long Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Direction</Label>
                  <Select value={formData.tradeDirection} onValueChange={(value) => updateFormData({ tradeDirection: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
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

              {/* Ticker and Risk */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Ticker Symbol</Label>
                  <Input
                    value={formData.ticker}
                    onChange={(e) => updateFormData({ ticker: e.target.value.toUpperCase() })}
                    placeholder="BTC, ETH, AAPL"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Risk Percentage</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.riskPercentage}
                    onChange={(e) => updateFormData({ riskPercentage: parseFloat(e.target.value) || 2.5 })}
                    placeholder="2.5"
                    required
                  />
                </div>
              </div>
            </ModernCardContent>
          </ModernCard>

          {/* Entry & Risk Management */}
          <ModernCard variant="elevated">
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-brand-primary" />
                Entry & Risk Management
              </ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent className="space-y-6">
              {/* Entry Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Entry Type</Label>
                  <Select value={formData.entryType} onValueChange={(value) => updateFormData({ entryType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select entry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                      <SelectItem value="trigger">Trigger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Entry Price (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.entryPrice || ''}
                    onChange={(e) => updateFormData({ entryPrice: parseFloat(e.target.value) || undefined })}
                    placeholder="45000.00"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Risk Management</Label>
                  <Select value={formData.riskManagement} onValueChange={(value) => updateFormData({ riskManagement: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stop_loss">Stop Loss</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Entry Conditions (Optional)</Label>
                  <Textarea
                    value={formData.entryConditions || ''}
                    onChange={(e) => updateFormData({ entryConditions: e.target.value })}
                    placeholder="Specific conditions for entry..."
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Stop Loss Conditions (Optional)</Label>
                  <Textarea
                    value={formData.stopLossConditions || ''}
                    onChange={(e) => updateFormData({ stopLossConditions: e.target.value })}
                    placeholder="Stop loss conditions..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Stop Loss Price */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Stop Loss Price (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.stopLossPrice || ''}
                  onChange={(e) => updateFormData({ stopLossPrice: parseFloat(e.target.value) || undefined })}
                  placeholder="40000.00"
                />
              </div>
            </ModernCardContent>
          </ModernCard>

          {/* Targets */}
          <ModernCard variant="elevated">
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-brand-primary" />
                Profit Targets
              </ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent className="space-y-4">
              {targets.map((target, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={target}
                    onChange={(e) => updateTarget(index, e.target.value)}
                    placeholder={`Target ${index + 1} price`}
                    type="number"
                    step="0.01"
                  />
                  {targets.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTarget(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addTarget}
                className="w-full"
              >
                Add Target
              </Button>
            </ModernCardContent>
          </ModernCard>

          {/* Full Description */}
          <ModernCard variant="elevated">
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand-primary" />
                Analysis & Description
              </ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent>
              <Textarea
                value={formData.fullDescription}
                onChange={(e) => updateFormData({ fullDescription: e.target.value })}
                placeholder="Provide detailed analysis, reasoning, and context for this trading signal..."
                className="min-h-[150px]"
                required
              />
            </ModernCardContent>
          </ModernCard>

          {/* Action Buttons */}
          <div className="flex gap-4 sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t border-border/50">
            <Button
              onClick={handlePreview}
              variant="outline"
              className="flex-1 flex items-center gap-2"
              disabled={!formData.analystName || !formData.market || !formData.ticker || !formData.fullDescription}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || !formData.analystName || !formData.market || !formData.ticker || !formData.fullDescription}
              className="flex-1 flex items-center gap-2"
            >
              {isCreating ? (
                <Zap className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isCreating ? 'Creating...' : 'Create Signal'}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Signal Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{formattedOutput}</pre>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
              Edit
            </Button>
            <Button onClick={() => { setShowPreview(false); handleSubmit(); }} disabled={isCreating} className="flex-1">
              Create Signal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}