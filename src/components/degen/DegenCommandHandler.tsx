import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useDegenCommandParser } from '@/hooks/useDegenCommandParser';
import { Badge } from '@/components/ui/badge';

export const DegenCommandHandler: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [parsedCommand, setParsedCommand] = useState<any>(null);
  const { parseDegenCommand, createSignalFromCommand, isProcessing } = useDegenCommandParser();

  const handleParseCommand = async () => {
    if (!inputMessage.trim()) return;
    
    const result = await parseDegenCommand(inputMessage);
    setParsedCommand(result);
  };

  const handleCreateSignal = async () => {
    if (!parsedCommand) return;
    
    await createSignalFromCommand(parsedCommand);
    setParsedCommand(null);
    setInputMessage('');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Degen Command Parser
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="command-input">Degen Command</Label>
          <Input
            id="command-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="!degen supporting long BTC entry 66000 stop 64000 targets 68000, 70000"
            className="font-mono"
          />
          <p className="text-sm text-muted-foreground">
            Format: !degen supporting long|short TICKER [entry X] [stop X] [targets X, Y, Z]
          </p>
        </div>

        <Button 
          onClick={handleParseCommand} 
          disabled={!inputMessage.trim() || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Parse Command'
          )}
        </Button>

        {parsedCommand && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {parsedCommand.direction === 'long' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                {parsedCommand.ticker} {parsedCommand.direction.toUpperCase()}
                <Badge variant={parsedCommand.direction === 'long' ? 'default' : 'destructive'}>
                  {parsedCommand.direction}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Entry Price</Label>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium">
                      {parsedCommand.entryPrice?.toFixed(4) || 'Market'}
                    </span>
                    {parsedCommand.currentPrice && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Stop Loss</Label>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium">
                      {parsedCommand.stopLoss?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {parsedCommand.targets && parsedCommand.targets.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Targets</Label>
                  <div className="flex flex-wrap gap-1">
                    {parsedCommand.targets.map((target: number, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        ${target.toFixed(4)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleCreateSignal}
                disabled={isProcessing}
                className="w-full mt-4"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Signal...
                  </>
                ) : (
                  'Create & Send Degen Signal'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Examples:</strong></p>
          <p>• !degen supporting long BTC</p>
          <p>• !degen supporting short ETH entry 3000 stop 3100</p>
          <p>• !degen supporting long SOL entry 200 targets 220, 240, 260</p>
        </div>
      </CardContent>
    </Card>
  );
};