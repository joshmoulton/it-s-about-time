
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernAuthModal } from '@/components/auth/ModernAuthModal';


const Login = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    // Don't auto-navigate on outside clicks
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center p-4">
      <ModernAuthModal 
        open={isModalOpen} 
        onOpenChange={handleModalClose}
        onExplicitClose={handleBackToHome}
      />
      
    </div>
  );
};

export default Login;
