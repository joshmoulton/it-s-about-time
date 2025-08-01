import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2 } from 'lucide-react';
import { SimplifiedAuth } from '@/utils/simplifiedAuthUtils';

interface MagicLinkFormProps {
  onSubmit: (data: { email: string }) => void;
  isLoading: boolean;
  error: string;
}

export const MagicLinkForm: React.FC<MagicLinkFormProps> = ({ onSubmit, isLoading, error }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSubmit({ email: email.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email Address</Label>
        <Input
          id="magic-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={isLoading}
          required
          autoComplete="email"
        />
      </div>

      <Button type="submit" disabled={isLoading || !email.trim()} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending Magic Link...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Send Magic Link
          </>
        )}
      </Button>

      <div className="text-sm text-muted-foreground text-center">
        <p>We'll send you a secure link to sign in</p>
      </div>
    </form>
  );
};