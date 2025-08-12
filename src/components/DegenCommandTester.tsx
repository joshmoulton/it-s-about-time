import React, { useState } from 'react';
import { useDegenCommandParser } from '@/hooks/useDegenCommandParser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DegenCommandTester() {
  const [testCommand, setTestCommand] = useState('!degen long rekt');
  const [result, setResult] = useState<any>(null);
  const { parseDegenCommand, createSignalFromCommand } = useDegenCommandParser();

  const handleTest = async () => {
    console.log('Testing command:', testCommand);
    const parsed = await parseDegenCommand(testCommand);
    console.log('Parsed result:', parsed);
    setResult(parsed);
  };

  const handleCreate = async () => {
    if (result) {
      try {
        await createSignalFromCommand(result, 'Test User');
      } catch (error) {
        console.error('Error creating signal:', error);
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Degen Command Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={testCommand}
          onChange={(e) => setTestCommand(e.target.value)}
          placeholder="Enter degen command"
        />
        <Button onClick={handleTest} className="w-full">
          Test Parse
        </Button>
        {result && (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Parsed:</strong>
              <pre className="mt-1 p-2 bg-muted rounded text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
            <Button onClick={handleCreate} className="w-full">
              Create Signal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}