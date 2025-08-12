import React from 'react';
import { DegenCommandHandler } from '@/components/degen/DegenCommandHandler';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function DegenCommandTester() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="h-6 w-6" />
              Degen Command Testing Interface
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Test and parse !degen commands that automatically fetch current prices from CoinGecko 
              when no entry price is specified. This tool creates trading signals and sends them to Telegram.
            </p>
            
            <DegenCommandHandler />
            
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Command Format:</h3>
              <code className="text-sm">
                !degen supporting [long|short] TICKER [entry X] [stop X] [targets X, Y, Z]
              </code>
              
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Automatic price fetching from CoinGecko API when no entry price provided</li>
                  <li>Support for long and short positions</li>
                  <li>Optional entry price, stop loss, and multiple targets</li>
                  <li>Automatic signal creation and Telegram notification</li>
                  <li>Real-time price display with "Current Price" badge</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}