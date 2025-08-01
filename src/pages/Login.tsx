
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernAuthModal } from '@/components/auth/ModernAuthModal';
import { WhopDebugPanel } from '@/components/auth/WhopDebugPanel';

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
      {/* Back to Home button */}
      <button
        onClick={handleBackToHome}
        className="fixed top-4 left-4 z-[60] bg-background/80 backdrop-blur-sm border border-border rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-background/90 transition-colors shadow-lg"
      >
        ← Back to Home
      </button>
      
      <ModernAuthModal 
        open={isModalOpen} 
        onOpenChange={handleModalClose}
        onExplicitClose={handleBackToHome}
      />
      <WhopDebugPanel />
    </div>
  );
};

export default Login;
