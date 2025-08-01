
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';

interface AuthFormModalProps {
  isSignUp: boolean;
  isLoading: boolean;
  error: string;
  email: string;
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBackClick: () => void;
}

export const AuthFormModal: React.FC<AuthFormModalProps> = ({
  isSignUp,
  isLoading,
  error,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onBackClick
}) => {
  const isMagicLink = password === "";
  const title = isMagicLink ? "Magic Link Sign In" : (isSignUp ? "Create Account" : "Sign In");
  const submitText = isMagicLink ? "Send Magic Link" : (isSignUp ? "Create Account" : "Sign In");

  return (
    <>
      <DialogHeader className="text-center pb-4">
        <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
        <p className="text-muted-foreground">
          {isMagicLink 
            ? "We'll send you a secure login link"
            : isSignUp 
              ? "Create your Weekly Wizdom account"
              : "Welcome back to Weekly Wizdom"
          }
        </p>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              className="pl-10"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {!isMagicLink && (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder={isSignUp ? "Create a password (min 8 chars)" : "Enter your password"}
                className="pl-10"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                disabled={isLoading}
                required
                minLength={isSignUp ? 8 : undefined}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isMagicLink ? "Sending..." : "Please wait..."}
            </>
          ) : (
            submitText
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
          Back to options
        </Button>
      </form>
    </>
  );
};
