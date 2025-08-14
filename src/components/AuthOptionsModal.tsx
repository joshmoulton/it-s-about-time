import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { EnhancedLoginForm } from './auth/EnhancedLoginForm';
import { Dialog, DialogContent } from './ui/dialog';

interface AuthOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthOptionsModal: React.FC<AuthOptionsModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useEnhancedAuth();

  const handleLoginSuccess = (user: any, authMethod: string) => {
    console.log('🎉 Login successful:', user.email, authMethod);
    setAuthenticatedUser(user, authMethod);
    onOpenChange(false);
    navigate('/dashboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-[95vw] max-w-md max-h-[90vh] overflow-hidden">
        <EnhancedLoginForm onSuccess={handleLoginSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default AuthOptionsModal;