import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, X } from 'lucide-react';

interface AuthFormViewsProps {
  mode: 'signin' | 'signup' | 'magic';
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string | React.ReactNode;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onShowPasswordToggle: () => void;
  onModeChange: (mode: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose?: () => void;
}

const MagicLinkView = memo<AuthFormViewsProps>(({
  email,
  isLoading,
  error,
  onEmailChange,
  onModeChange,
  onSubmit,
  onClose
}) => (
  <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (onClose) {
              onClose(); // This will trigger handleBackToHome
            } else {
              onModeChange('welcome');
            }
          }}
          className="text-gray-600 hover:text-black hover:bg-gray-50 border-gray-300 p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-black">Magic Link</h2>
          <p className="text-gray-600">We'll send you a secure login link</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-12 pl-10 bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-brand-primary"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {error && (
          <div className="text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
            {typeof error === 'string' ? (
              <div className="text-red-600">{error}</div>
            ) : (
              error
            )}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-12 bg-brand-primary text-white hover:bg-brand-primary/90 font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Magic Link'
          )}
        </Button>
      </form>

      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => onModeChange('signup')}
          className="text-gray-600 hover:text-black hover:bg-gray-50"
        >
          Need an account? Sign up
        </Button>
      </div>
    </div>
  </div>
));

const SignInView = memo<AuthFormViewsProps>(({
  email,
  password,
  showPassword,
  isLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onShowPasswordToggle,
  onModeChange,
  onSubmit,
  onClose
}) => (
  <div className="relative w-full">
    {/* Close Button */}
    {onClose && (
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors z-10"
        aria-label="Close modal"
      >
        <X className="w-4 h-4" />
      </button>
    )}

    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Welcome back!</h2>
        <p className="text-sm text-muted-foreground">Enter your email below to login to your account.</p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email Address <span className="text-primary">*</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="flowlet@gmail.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-11 pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Password <span className="text-primary">*</span></label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange('magic')}
              className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
              type="button"
            >
              Forgot password?
            </Button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="h-11 pl-10 pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={onShowPasswordToggle}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="remember"
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="remember" className="text-xs text-muted-foreground">
            Remember me
          </label>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our{' '}
        <a href="#" className="underline hover:text-foreground">Terms of Service</a>{' '}
        and{' '}
        <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
      </div>

      {/* Back to Welcome */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => onModeChange('welcome')}
          className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
          type="button"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to options
        </Button>
      </div>
    </div>
  </div>
));

const SignUpView = memo<AuthFormViewsProps>(({
  email,
  password,
  confirmPassword,
  showPassword,
  isLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordToggle,
  onModeChange,
  onSubmit,
  onClose
}) => (
  <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onModeChange('welcome')}
          className="text-gray-600 hover:text-black hover:bg-gray-50 border-gray-300 p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-black">Create Account</h2>
          <p className="text-gray-600">Join Weekly Wizdom today</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-12 pl-10 bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-brand-primary"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password (min 8 chars)"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="h-12 pl-10 pr-10 bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-brand-primary"
              disabled={isLoading}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={onShowPasswordToggle}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              className="h-12 pl-10 bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-brand-primary"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-12 bg-brand-primary text-white hover:bg-brand-primary/90 font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => onModeChange('signin')}
          className="text-gray-600 hover:text-black hover:bg-gray-50"
        >
          Already have an account? Sign in
        </Button>
      </div>
    </div>
  </div>
));

MagicLinkView.displayName = 'MagicLinkView';
SignInView.displayName = 'SignInView';
SignUpView.displayName = 'SignUpView';

export { MagicLinkView, SignInView, SignUpView };