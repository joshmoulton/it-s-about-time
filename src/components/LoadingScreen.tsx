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
    // Show main logo after 400ms
    const logoTimer = setTimeout(() => setShowMainLogo(true), 400);
    
    // Show text logo after 1000ms
    const textTimer = setTimeout(() => setShowTextLogo(true), 1000);
    
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
        {/* Main Logo (Icon/Symbol) - Only show when timer triggers */}
        {showMainLogo && (
          <img 
            src={mainLogoUrl}
            alt="Weekly Wizdom Logo" 
            className={`w-48 h-auto object-contain transition-all duration-700 ease-out ${
              !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            loading="eager"
            decoding="async"
            onError={(e) => {
              // Enhanced fallback with responsive sizing
              const target = e.currentTarget;
              target.outerHTML = `
                <div class="w-48 h-auto bg-white/20 rounded-2xl flex items-center justify-center transition-all duration-700 ease-out ${
                  !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }">
                  <span class="text-white text-5xl font-bold">WW</span>
                </div>
              `;
            }}
          />
        )}
        
        {/* Text Logo (Brand Name) - Only show when timer triggers */}
        {showTextLogo && (
          <img 
            src={textLogoUrl}
            alt="Weekly Wizdom Brand" 
            className={`w-64 h-auto object-contain transition-all duration-700 ease-out delay-150 ${
              !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            loading="eager"
            decoding="async"
            onError={(e) => {
              // Enhanced fallback to responsive text
              const target = e.currentTarget;
              target.outerHTML = `
                <div class="w-64 transition-all duration-700 ease-out delay-150 ${
                  !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }">
                  <h1 class="text-white text-3xl sm:text-4xl font-bold tracking-tight text-center">Weekly Wizdom</h1>
                  <p class="text-white/80 text-center text-base sm:text-lg mt-2">Financial Intelligence Delivered</p>
                </div>
              `;
            }}
          />
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;