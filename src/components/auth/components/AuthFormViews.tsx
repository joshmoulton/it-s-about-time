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
  <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-lg mx-auto border border-border/50 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-60"></div>
    <div className="relative z-10">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 z-10 bg-background/80 hover:bg-background rounded-full p-2 shadow-lg backdrop-blur-sm"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onModeChange('welcome')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 border-border/50 p-3 rounded-xl transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Magic Link
            </h2>
            <p className="text-muted-foreground text-base">We'll send you a secure login link</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Email address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="h-14 pl-12 bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 rounded-xl text-base backdrop-blur-sm shadow-sm"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm bg-destructive/10 border border-destructive/20 p-4 rounded-xl backdrop-blur-sm">
              {typeof error === 'string' ? (
                <div className="text-destructive">{error}</div>
              ) : (
                error
              )}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
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
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 hover:scale-105 font-medium"
          >
            Need an account? Sign up
          </Button>
        </div>
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
  <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-lg mx-auto border border-border/50 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-60"></div>
    <div className="relative z-10">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 z-10 bg-background/80 hover:bg-background rounded-full p-2 shadow-lg backdrop-blur-sm"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-sm border border-primary/20">
            <Mail className="w-10 h-10 text-primary drop-shadow-sm" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3">
            Welcome back!
          </h2>
          <p className="text-base text-muted-foreground">Enter your email below to login to your account.</p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Email Address <span className="text-primary">*</span></label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="flowlet@gmail.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="h-14 pl-12 bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 rounded-xl text-base backdrop-blur-sm shadow-sm"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Password <span className="text-primary">*</span></label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onModeChange('magic')}
                className="text-xs text-muted-foreground hover:text-primary p-0 h-auto font-medium transition-all duration-200 hover:scale-105"
                type="button"
              >
                Forgot password?
              </Button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                className="h-14 pl-12 pr-12 bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 rounded-xl text-base backdrop-blur-sm shadow-sm"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={onShowPasswordToggle}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="remember" className="text-sm text-muted-foreground">
              Remember me
            </label>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-xl backdrop-blur-sm">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground bg-muted/20 p-4 rounded-xl backdrop-blur-sm">
          By clicking continue, you agree to our{' '}
          <a href="#" className="underline hover:text-primary transition-colors">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-primary transition-colors">Privacy Policy</a>
        </div>

        {/* Back to Welcome */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => onModeChange('welcome')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-0 h-auto flex items-center gap-2 font-medium transition-all duration-300 hover:scale-105"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to options
          </Button>
        </div>
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
  <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-lg mx-auto border border-border/50 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-60"></div>
    <div className="relative z-10">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 z-10 bg-background/80 hover:bg-background rounded-full p-2 shadow-lg backdrop-blur-sm"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onModeChange('welcome')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 border-border/50 p-3 rounded-xl transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Create Account
            </h2>
            <p className="text-muted-foreground text-base">Join Weekly Wizdom today</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Email address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="h-14 pl-12 bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 rounded-xl text-base backdrop-blur-sm shadow-sm"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password (min 8 chars)"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                className="h-14 pl-12 pr-12 bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 rounded-xl text-base backdrop-blur-sm shadow-sm"
                disabled={isLoading}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={onShowPasswordToggle}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                className="h-14 pl-12 bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 rounded-xl text-base backdrop-blur-sm shadow-sm"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-xl backdrop-blur-sm">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
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
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 hover:scale-105 font-medium"
          >
            Already have an account? Sign in
          </Button>
        </div>
      </div>
    </div>
  </div>
));

MagicLinkView.displayName = 'MagicLinkView';
SignInView.displayName = 'SignInView';
SignUpView.displayName = 'SignUpView';

export { MagicLinkView, SignInView, SignUpView };