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
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [currentLogoSrc, setCurrentLogoSrc] = useState('');

  // Logo sources in order of preference
  const logoSources = [
    'https://wrvvlmevpvcenauglcyz.supabase.co/storage/v1/object/public/assets/Property%201%3DDefault%20%281%29.png',
    'https://wrvvlmevpvcenauglcyz.supabase.co/storage/v1/object/public/assets/logo.jpg'
  ];

  // Preload logo images
  useEffect(() => {
    console.log('🔄 Preloading logo images...');
    
    const preloadImage = (src: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log(`✅ Successfully preloaded: ${src}`);
          resolve(src);
        };
        img.onerror = () => {
          console.warn(`❌ Failed to preload: ${src}`);
          reject(src);
        };
        img.src = src;
      });
    };

    // Try to preload the first working logo
    const loadFirstAvailableLogo = async () => {
      for (const src of logoSources) {
        try {
          await preloadImage(src);
          console.log(`🎯 Using logo source: ${src}`);
          setCurrentLogoSrc(src);
          setLogoLoaded(true);
          return;
        } catch (error) {
          console.warn(`⚠️ Logo source failed: ${src}`);
        }
      }
      
      console.error('❌ All logo sources failed to load');
      setLogoError(true);
    };

    loadFirstAvailableLogo();
  }, []);

  useEffect(() => {
    console.log('🎨 Loading screen state:', { logoLoaded, logoError, showLogo, showText, isVisible });
    
    // Only start animations after logo loads or if there's an error
    if (!logoLoaded && !logoError) {
      console.log('⏳ Waiting for logo to load...');
      return;
    }

    console.log('🚀 Starting loading screen animations');

    // Fade in main logo first (slower start)
    const logoTimer = setTimeout(() => {
      console.log('✨ Showing logo');
      setShowLogo(true);
    }, 400);

    // Show text logo with more delay after main logo
    const textTimer = setTimeout(() => {
      console.log('📝 Showing text');
      setShowText(true);
    }, 1000);
    
    // Show loading screen for longer, then start fade out
    const fadeTimer = setTimeout(() => {
      console.log('🌅 Starting fade out');
      setIsFadingOut(true);
      
    // After fade animation completes, hide loading screen and reveal main content
      setTimeout(() => {
        console.log('✅ Loading complete');
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
  }, [onLoadingComplete, logoLoaded, logoError]);

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
        {currentLogoSrc && (
          <img 
            src={currentLogoSrc}
            alt="Weekly Wizdom" 
            className={`w-32 h-32 transition-all duration-700 ease-out ${
              showLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            onLoad={() => {
              console.log(`🖼️ Logo displayed successfully from: ${currentLogoSrc}`);
            }}
            onError={(e) => {
              console.error(`❌ Logo display failed for: ${currentLogoSrc}`, e);
            }}
          />
        )}
        
        {/* Fallback logo placeholder if all sources fail */}
        {logoError && !currentLogoSrc && (
          <div className={`w-32 h-32 bg-white/10 rounded-xl flex items-center justify-center transition-all duration-700 ease-out ${
            showLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <span className="text-white text-4xl font-bold">WW</span>
          </div>
        )}
        
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