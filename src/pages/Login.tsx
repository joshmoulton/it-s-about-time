
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ModernAuthModal } from '@/components/auth/ModernAuthModal';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';


const Login = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useEnhancedAuth();

  // If already authenticated or just completed magic-link verification, redirect to dashboard
  useEffect(() => {
    const justLoggedInAt = Number(sessionStorage.getItem('ww.justLoggedIn') || '0');
    const withinGrace = justLoggedInAt > 0 && Date.now() - justLoggedInAt < 10000;
    if (isAuthenticated || withinGrace) {
      // Clear the flag once we honor it
      if (withinGrace) sessionStorage.removeItem('ww.justLoggedIn');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
