import { useEffect, useState } from 'react';
import { getLogoUrl } from '@/utils/uploadLogo';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showMainLogo, setShowMainLogo] = useState(false);
  const [showTextLogo, setShowTextLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Get logo URL from Supabase
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const url = await getLogoUrl();
        setLogoUrl(url);
      } catch (error) {
        console.error('Failed to load logo:', error);
        // Continue without logo
      }
    };
    fetchLogo();
  }, []);

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
        {/* Main Logo */}
        {logoUrl && (
          <img 
            src={logoUrl}
            alt="Weekly Wizdom Logo" 
            className={`w-32 h-32 object-contain transition-all duration-700 ease-out will-change-transform ${
              showMainLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />
        )}
        
        {/* Fallback logo if Supabase logo fails */}
        {!logoUrl && (
          <div className={`w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center transition-all duration-700 ease-out will-change-transform ${
            showMainLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <span className="text-white text-3xl font-bold">WW</span>
          </div>
        )}
        
        {/* Text Logo */}
        <div className={`transition-all duration-700 ease-out delay-150 will-change-transform ${
          showTextLogo && !isFadingOut ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <h1 className="text-white text-4xl font-bold tracking-tight">
            Weekly Wizdom
          </h1>
          <p className="text-white/80 text-center text-lg mt-2">
            Financial Intelligence Delivered
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;