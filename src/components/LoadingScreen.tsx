import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Fade in main logo first (slower start)
    const logoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 400);

    // Show text logo with more delay after main logo
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 1000);
    
    // Show loading screen for longer, then start fade out
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      
    // After fade animation completes, hide loading screen and reveal main content
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('hasSeenLoading', 'true');
        onLoadingComplete();
      }, 800); // Wait for full fade duration
    }, 2200);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
    };
  }, [onLoadingComplete]);

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 bg-primary z-[9999] flex items-center justify-center transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
        {/* Main Logo */}
        <img 
          src="/lovable-uploads/92103cfe-defa-4004-b1bb-7d6498f567ed.png" 
          alt="Weekly Wizdom" 
          className={`w-48 h-auto transition-all duration-700 ease-out ${
            showLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />
        
        {/* Text Logo */}
        <img 
          src="/lovable-uploads/760c309c-e0cf-4e84-96b7-5cedf426aa74.png" 
          alt="Weekly Wizdom Text" 
          className={`w-64 h-auto transition-all duration-700 ease-out delay-150 ${
            showText && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;