import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2 } from 'lucide-react';


interface MagicLinkFormProps {
  onSubmit: (data: { email: string }) => void;
  isLoading: boolean;
  error: string;
  buttonText?: string;
}

export const MagicLinkForm: React.FC<MagicLinkFormProps> = ({ onSubmit, isLoading, error, buttonText = "Send Magic Link" }) => {
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
            {buttonText === "Check Subscription" ? "Checking..." : "Sending Magic Link..."}
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>

      <div className="text-sm text-muted-foreground text-center">
        <p>{buttonText === "Check Subscription" ? "We'll verify your newsletter subscription" : "We'll send you a secure link to sign in"}</p>
      </div>
    </form>
  );
};