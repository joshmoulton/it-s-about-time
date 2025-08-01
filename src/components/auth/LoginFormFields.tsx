
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';

interface LoginFormFieldsProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  method: string;
  isLoading: boolean;
}

export const LoginFormFields: React.FC<LoginFormFieldsProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  method,
  isLoading,
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your subscriber email"
            className="pl-12 h-12 bg-brand-white border-gray-300 rounded-xl focus:bg-brand-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-brand-navy placeholder:text-gray-500 shadow-sm"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      {(method === 'signin' || method === 'signup') && (
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={method === 'signup' ? "Create a password" : "Enter your password"}
            className="h-12 bg-brand-white border-gray-300 rounded-xl focus:bg-brand-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-brand-navy placeholder:text-gray-500 shadow-sm"
            disabled={isLoading}
            required
          />
        </div>
      )}
    </>
  );
};
