import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, RefreshCw, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordGeneratorProps {
  onPasswordGenerated: (password: string) => void;
}

export function PasswordGenerator({ onPasswordGenerated }: PasswordGeneratorProps) {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
  });

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const similar = 'il1Lo0O';

    let charset = '';
    const required = [];

    if (options.includeUppercase) {
      const chars = options.excludeSimilar ? uppercase.replace(/[LO]/g, '') : uppercase;
      charset += chars;
      required.push(chars[Math.floor(Math.random() * chars.length)]);
    }

    if (options.includeLowercase) {
      const chars = options.excludeSimilar ? lowercase.replace(/[il]/g, '') : lowercase;
      charset += chars;
      required.push(chars[Math.floor(Math.random() * chars.length)]);
    }

    if (options.includeNumbers) {
      const chars = options.excludeSimilar ? numbers.replace(/[10]/g, '') : numbers;
      charset += chars;
      required.push(chars[Math.floor(Math.random() * chars.length)]);
    }

    if (options.includeSymbols) {
      charset += symbols;
      required.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }

    if (options.excludeSimilar) {
      charset = charset.split('').filter(char => !similar.includes(char)).join('');
    }

    if (!charset) {
      toast.error('Please select at least one character type');
      return;
    }

    let password = '';
    
    // Add required characters first
    for (const char of required) {
      password += char;
    }

    // Fill the rest randomly
    for (let i = required.length; i < options.length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    setGeneratedPassword(password);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!generatedPassword) return;
    
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success('Password copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy password');
    }
  };

  const useGeneratedPassword = () => {
    if (!generatedPassword) return;
    onPasswordGenerated(generatedPassword);
    toast.success('Password applied to form!');
  };

  const getStrengthColor = () => {
    if (options.length < 8) return 'text-red-500';
    if (options.length < 12) return 'text-yellow-500';
    if (options.length < 16) return 'text-blue-500';
    return 'text-green-500';
  };

  const getStrengthText = () => {
    const score = calculateStrength();
    if (score < 30) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Good';
    return 'Strong';
  };

  const calculateStrength = () => {
    let score = 0;
    score += options.length * 2;
    if (options.includeUppercase) score += 10;
    if (options.includeLowercase) score += 10;
    if (options.includeNumbers) score += 10;
    if (options.includeSymbols) score += 15;
    if (options.excludeSimilar) score += 5;
    return Math.min(score, 100);
  };

  return (
    <Card className="border border-brand-navy/20 bg-brand-navy/5 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Password Generator</h4>
        </div>

        {/* Password Output */}
        {generatedPassword && (
          <div className="space-y-3 mb-6">
            <Label className="text-sm font-medium">Generated Password</Label>
            <div className="flex gap-2">
              <Input
                value={generatedPassword}
                readOnly
                className="font-mono text-sm bg-input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="px-3"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${getStrengthColor()}`}>
                Strength: {getStrengthText()}
              </span>
              <Button
                onClick={useGeneratedPassword}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Use This Password
              </Button>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Length: {options.length}</Label>
              <span className={`text-xs ${getStrengthColor()}`}>
                {getStrengthText()}
              </span>
            </div>
            <Slider
              value={[options.length]}
              onValueChange={(value) => setOptions(prev => ({ ...prev, length: value[0] }))}
              min={8}
              max={64}
              step={1}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="uppercase" className="text-sm">Uppercase (A-Z)</Label>
              <Switch
                id="uppercase"
                checked={options.includeUppercase}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeUppercase: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="lowercase" className="text-sm">Lowercase (a-z)</Label>
              <Switch
                id="lowercase"
                checked={options.includeLowercase}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeLowercase: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="numbers" className="text-sm">Numbers (0-9)</Label>
              <Switch
                id="numbers"
                checked={options.includeNumbers}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeNumbers: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="symbols" className="text-sm">Symbols (!@#$%...)</Label>
              <Switch
                id="symbols"
                checked={options.includeSymbols}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSymbols: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="exclude-similar" className="text-sm">Exclude similar (il1Lo0O)</Label>
              <Switch
                id="exclude-similar"
                checked={options.excludeSimilar}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excludeSimilar: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generatePassword}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate Password
        </Button>

        {/* Security Tips */}
        <div className="mt-4 text-xs text-foreground/70 space-y-1">
          <p>💡 <strong>Tip:</strong> Use at least 12 characters for better security</p>
          <p>🔒 <strong>Security:</strong> This generator works offline - passwords are not sent anywhere</p>
        </div>
      </CardContent>
    </Card>
  );
}