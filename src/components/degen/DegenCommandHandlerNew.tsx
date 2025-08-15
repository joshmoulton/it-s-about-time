import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDegenCommandParser } from '@/hooks/useDegenCommandParserNew';

export function DegenCommandHandler() {
  const [inputMessage, setInputMessage] = useState('');
  const [parsedCommand, setParsedCommand] = useState<any>(null);
  const { parseDegenCommand, createSignalFromCommand, isProcessing } = useDegenCommandParser();

  const handleParseCommand = async () => {
    const result = await parseDegenCommand(inputMessage);
    setParsedCommand(result);
  };

  const handleCreateSignal = async () => {
    if (parsedCommand) {
      await createSignalFromCommand(parsedCommand);
      setInputMessage('');
      setParsedCommand(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="Enter command: !degen long BTC entry 60000 stop 58000 targets 65000,70000 size high"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <Button onClick={handleParseCommand} disabled={!inputMessage || isProcessing}>
          Parse Command
        </Button>
      </div>

      {parsedCommand && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Command</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{parsedCommand.ticker}</Badge>
              <Badge variant={parsedCommand.direction === 'long' ? 'default' : 'destructive'}>
                {parsedCommand.direction.toUpperCase()}
              </Badge>
              {parsedCommand.entry_type && (
                <Badge variant="secondary">{parsedCommand.entry_type}</Badge>
              )}
              {parsedCommand.size_level && (
                <Badge variant="outline">{parsedCommand.size_level}</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Entry: ${parsedCommand.entry_price?.toFixed(4) || 'Market'}</div>
              <div>Stop: ${parsedCommand.stop_loss?.toFixed(4) || 'N/A'}</div>
            </div>
            
            {parsedCommand.targets?.length > 0 && (
              <div className="text-sm">
                Targets: {parsedCommand.targets.map((t: number) => `$${t.toFixed(4)}`).join(', ')}
              </div>
            )}
            
            {parsedCommand.reasoning && (
              <div className="text-sm bg-muted p-2 rounded">
                Reasoning: {parsedCommand.reasoning}
              </div>
            )}
            
            <Button onClick={handleCreateSignal} disabled={isProcessing}>
              Create & Send Signal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}