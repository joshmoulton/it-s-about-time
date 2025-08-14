import React from 'react';
import { SimplifiedAuthModal } from './auth/SimplifiedAuthModal';

interface AuthOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthOptionsModal: React.FC<AuthOptionsModalProps> = ({ open, onOpenChange }) => {
  return (
    <SimplifiedAuthModal 
      open={open} 
      onOpenChange={onOpenChange} 
    />
  );
};

export default AuthOptionsModal;