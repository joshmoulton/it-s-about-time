import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { SimplifiedAuthModal } from './auth/SimplifiedAuthModal';

interface AuthOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthOptionsModal: React.FC<AuthOptionsModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  const handleExplicitClose = () => {
    onOpenChange(false);
  };

  return (
    <SimplifiedAuthModal 
      open={open} 
      onOpenChange={onOpenChange}
      onExplicitClose={handleExplicitClose}
    />
  );
};

export default AuthOptionsModal;