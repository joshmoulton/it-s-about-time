import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

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
      className={`fixed inset-0 bg-gradient-to-br from-blue-500 to-blue-600 z-[9999] flex items-center justify-center transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Sparkle decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <Sparkles className="absolute top-1/4 left-1/4 text-white/30 w-6 h-6 animate-pulse" />
        <Sparkles className="absolute top-3/4 right-1/4 text-white/20 w-4 h-4 animate-pulse delay-500" />
        <Sparkles className="absolute top-1/2 right-1/3 text-white/25 w-5 h-5 animate-pulse delay-1000" />
        <Sparkles className="absolute bottom-1/3 left-1/3 text-white/30 w-4 h-4 animate-pulse delay-700" />
      </div>

      <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
        {/* Main Logo */}
        <img 
          src="https://wrvvlmevpvcenauglcyz.supabase.co/storage/v1/object/public/assets//Property%201=Default%20(1).png"
          alt="Weekly Wizdom" 
          className={`w-32 h-32 transition-all duration-700 ease-out ${
            showLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />
        
        {/* Text */}
        <h1 
          className={`text-white text-3xl font-bold tracking-wide transition-all duration-700 ease-out delay-150 ${
            showText && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          Weekly Wizdom
        </h1>
      </div>
    </div>
  );
};

export default LoadingScreen;