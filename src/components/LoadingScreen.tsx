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

  useEffect(() => {
    // Fade in main logo first
    const logoTimer = setTimeout(() => setShowMainLogo(true), 400);
    
    // Show text logo with more delay
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
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Main Logo (Icon/Symbol) */}
        <img 
          src={mainLogoUrl}
          alt="Weekly Wizdom Logo" 
          className={`w-32 h-32 object-contain transition-all duration-700 ease-out will-change-transform ${
            showMainLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onError={(e) => {
            // Fallback if main logo fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* Text Logo (Brand Name) */}
        <img 
          src={textLogoUrl}
          alt="Weekly Wizdom Brand" 
          className={`h-16 object-contain transition-all duration-700 ease-out delay-150 will-change-transform ${
            showTextLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onError={(e) => {
            // Fallback to text if text logo fails to load
            e.currentTarget.outerHTML = `
              <div class="transition-all duration-700 ease-out delay-150 will-change-transform ${
                showTextLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }">
                <h1 class="text-white text-4xl font-bold tracking-tight">Weekly Wizdom</h1>
                <p class="text-white/80 text-center text-lg mt-2">Financial Intelligence Delivered</p>
              </div>
            `;
          }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;