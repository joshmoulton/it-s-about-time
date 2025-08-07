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
          <h2 className="text-2xl font-bold text-black">Sign In</h2>
          <p className="text-gray-600">Welcome back to Weekly Wizdom</p>
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="h-12 pl-10 pr-10 bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-brand-primary"
              disabled={isLoading}
              required
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
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <div className="flex justify-between text-sm">
        <Button
          variant="ghost"
          onClick={() => onModeChange('magic')}
          className="text-gray-600 hover:text-black hover:bg-gray-50 p-0 h-auto"
        >
          Try magic link instead
        </Button>
        <Button
          variant="ghost"
          onClick={() => onModeChange('signup')}
          className="text-gray-600 hover:text-black hover:bg-gray-50 p-0 h-auto"
        >
          Need an account?
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