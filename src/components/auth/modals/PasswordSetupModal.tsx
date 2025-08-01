
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';

interface PasswordSetupModalProps {
  isLoading: boolean;
  error: string;
  setupEmail: string;
  password: string;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBackClick: () => void;
}

export const PasswordSetupModal: React.FC<PasswordSetupModalProps> = ({
  isLoading,
  error,
  setupEmail,
  password,
  onPasswordChange,
  onSubmit,
  onBackClick
}) => {
  return (
    <>
      <DialogHeader className="text-center pb-4">
        <DialogTitle className="text-2xl font-bold">Setup Your Password</DialogTitle>
        <p className="text-muted-foreground">
          Create a password for your Weekly Wizdom account
        </p>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="setup-email">Email</Label>
          <Input
            id="setup-email"
            type="email"
            value={setupEmail}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="setup-password"
              type="password"
              placeholder="Create a strong password (min 8 chars)"
              className="pl-10"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters long
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up password...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onBackClick}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to login
        </Button>
      </form>
    </>
  );
};
