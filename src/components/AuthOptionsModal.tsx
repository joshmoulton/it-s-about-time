import React from 'react';
import { ModernAuthModal } from './auth/ModernAuthModal';

interface AuthOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthOptionsModal: React.FC<AuthOptionsModalProps> = ({ open, onOpenChange }) => {
  return (
    <ModernAuthModal 
      open={open} 
      onOpenChange={onOpenChange} 
    />
  );
};

export default AuthOptionsModal;