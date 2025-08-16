import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showMainLogo, setShowMainLogo] = useState(false);
  const [showTextLogo, setShowTextLogo] = useState(false);

  // Direct logo URLs from Lovable uploads
  const mainLogoUrl = '/lovable-uploads/92103cfe-defa-4004-b1bb-7d6498f567ed.png';
  const textLogoUrl = '/lovable-uploads/760c309c-e0cf-4e84-96b7-5cedf426aa74.png';

  // Preload images for immediate display
  useEffect(() => {
    const preloadImages = () => {
      const mainImg = new Image();
      const textImg = new Image();
      
      mainImg.src = mainLogoUrl;
      textImg.src = textLogoUrl;
      
      // Add to document head for faster loading
      const mainLink = document.createElement('link');
      mainLink.rel = 'preload';
      mainLink.as = 'image';
      mainLink.href = mainLogoUrl;
      
      const textLink = document.createElement('link');
      textLink.rel = 'preload';
      textLink.as = 'image';
      textLink.href = textLogoUrl;
      
      document.head.appendChild(mainLink);
      document.head.appendChild(textLink);
      
      // Cleanup function
      return () => {
        document.head.removeChild(mainLink);
        document.head.removeChild(textLink);
      };
    };
    
    const cleanup = preloadImages();
    return cleanup;
  }, []);

  useEffect(() => {
    // Show main logo immediately (reduced from 400ms to 100ms)
    const logoTimer = setTimeout(() => setShowMainLogo(true), 100);
    
    // Show text logo faster (reduced from 1000ms to 600ms)
    const textTimer = setTimeout(() => setShowTextLogo(true), 600);
    
    // Start fade out after 2.2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      
      // Complete fade and hide
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('hasSeenLoading', 'true');
        onLoadingComplete();
      }, 800);
    }, 2200);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
    };
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-primary z-[9999] flex items-center justify-center transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Main Logo (Icon/Symbol) - Enhanced Responsive Sizing */}
        <img 
          src={mainLogoUrl}
          alt="Weekly Wizdom Logo" 
          className={`w-56 sm:w-64 lg:w-72 h-56 sm:h-64 lg:h-72 max-w-xs sm:max-w-sm lg:max-w-md object-contain transition-all duration-700 ease-out will-change-transform gpu-accelerated ${
            showMainLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          loading="eager"
          decoding="async"
        />
        
        {/* Text Logo (Brand Name) - Enhanced Responsive Sizing */}
        <img 
          src={textLogoUrl}
          alt="Weekly Wizdom Brand" 
          className={`h-20 sm:h-24 lg:h-28 max-w-xs sm:max-w-sm lg:max-w-md object-contain transition-all duration-700 ease-out delay-150 will-change-transform gpu-accelerated ${
            showTextLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
};

export default LoadingScreen;