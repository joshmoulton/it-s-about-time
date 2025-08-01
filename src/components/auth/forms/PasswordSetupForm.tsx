
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { RememberMeOption } from '@/components/auth/RememberMeOption';

const setupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

type SetupFormData = z.infer<typeof setupSchema>;

interface PasswordSetupFormProps {
  email: string;
  onSubmit: (data: SetupFormData) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string;
  rememberMe: boolean;
  onRememberMeChange: (checked: boolean) => void;
}

export const PasswordSetupForm: React.FC<PasswordSetupFormProps> = ({
  email,
  onSubmit,
  onBack,
  isLoading,
  error,
  rememberMe,
  onRememberMeChange
}) => {
  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: { email: '', password: '' }
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Setup Your Password</CardTitle>
        <CardDescription className="text-center">
          Create a password for your Weekly Wizdom account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-email">Email</Label>
            <Input
              id="setup-email"
              type="email"
              value={email}
              disabled
              className="bg-muted"
              autoComplete="new-password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="setup-password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="setup-password"
                type="password"
                placeholder="Create a strong password"
                className="pl-10"
                autoComplete="new-password"
                {...form.register('password')}
              />
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <RememberMeOption
            checked={rememberMe}
            onCheckedChange={onRememberMeChange}
            disabled={isLoading}
          />

          {error && (
            <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
            onClick={onBack}
          >
            Back to Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
