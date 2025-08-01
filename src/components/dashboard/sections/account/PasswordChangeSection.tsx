import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff, Shield, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PasswordGenerator } from './PasswordGenerator';
export function PasswordChangeSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const passwordRequirements = [{
    met: passwords.new.length >= 8,
    text: 'At least 8 characters'
  }, {
    met: /[A-Z]/.test(passwords.new),
    text: 'One uppercase letter'
  }, {
    met: /[a-z]/.test(passwords.new),
    text: 'One lowercase letter'
  }, {
    met: /\d/.test(passwords.new),
    text: 'One number'
  }, {
    met: passwords.new === passwords.confirm && passwords.new.length > 0,
    text: 'Passwords match'
  }];
  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Please fill in all fields');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: passwords.new
      });
      if (error) throw error;
      toast.success('Password updated successfully!');
      setPasswords({
        current: '',
        new: '',
        confirm: ''
      });
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleGeneratedPassword = (generatedPassword: string) => {
    setPasswords(prev => ({
      ...prev,
      new: generatedPassword,
      confirm: generatedPassword
    }));
  };
  const isFormValid = passwordRequirements.every(req => req.met);
  return <div className="max-w-2xl mx-auto space-y-8">
      

      <Card className="border border-brand-navy/20 bg-brand-navy/5 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold">Security Settings</h3>
          </div>

          <div className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type={showCurrentPassword ? 'text' : 'password'} placeholder="Enter your current password" value={passwords.current} onChange={e => handleInputChange('current', e.target.value)} className="h-12 pl-11 pr-11" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type={showNewPassword ? 'text' : 'password'} placeholder="Enter your new password" value={passwords.new} onChange={e => handleInputChange('new', e.target.value)} className="h-12 pl-11 pr-11" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your new password" value={passwords.confirm} onChange={e => handleInputChange('confirm', e.target.value)} className="h-12 pl-11 pr-11" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {passwords.new && <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-foreground">Password Requirements</h4>
                <div className="grid grid-cols-1 gap-2">
                  {passwordRequirements.map((requirement, index) => <div key={index} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${requirement.met ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                        {requirement.met && <Check className="h-3 w-3" />}
                      </div>
                      <span className={`text-sm ${requirement.met ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {requirement.text}
                      </span>
                    </div>)}
                </div>
              </div>}

            {/* Save Button */}
            <Button onClick={handlePasswordChange} disabled={isLoading || !isFormValid} className="w-full h-12 bg-gradient-to-r from-brand-navy to-brand-navy-dark hover:from-brand-navy-dark hover:to-brand-navy text-white font-medium disabled:opacity-50">
              {isLoading ? <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating Password...
                </> : <>
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Generator */}
      <PasswordGenerator onPasswordGenerated={handleGeneratedPassword} />

      {/* Security Tips */}
      
    </div>;
}