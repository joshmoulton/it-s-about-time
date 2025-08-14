import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function SimpleAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setStatus('checking');
    setMessage('Sending secure login link...');

    try {
      // Use send-magic-link which handles both Beehiiv verification and sends beautiful Resend email
      const { data, error } = await supabase.functions.invoke(
        'send-magic-link',
        { body: { email: email.toLowerCase().trim() } }
      );

      if (error || !data?.success) {
        setStatus('error');
        setMessage(data?.error || 'Email not found in our subscription list. Please sign up for Weekly Wizdom newsletter first.');
        setIsLoading(false);
        return;
      }

      setStatus('sent');
      setMessage('Login link sent! Check your email and click the link to access your dashboard.');
    } catch (error) {
      console.error('Login error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg border p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Welcome to Weekly Wizdom</h1>
          <p className="text-muted-foreground">
            Access your premium dashboard with your subscription email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your subscription email"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {status === 'checking' ? 'Verifying...' : 'Sending...'}
              </>
            ) : (
              'Send Login Link'
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-md flex items-start ${
            status === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : status === 'sent'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {status === 'error' && <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />}
            {status === 'sent' && <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />}
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have a subscription?{' '}
            <a 
              href="https://weeklywizdom.beehiiv.com/subscribe" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Subscribe to Weekly Wizdom
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}