import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/LazyImage";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { smoothScrollTo, createScrollHandler } from '@/utils/smoothScroll';
import { navigateToSection } from '@/utils/hashNavigation';

interface HeroNavigationProps {
  onAuthClick: () => void;
  onPremiumClick?: () => void;
}

const HeroNavigation = ({
  onAuthClick,
  onPremiumClick
}: HeroNavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { theme } = useTheme();
  const { currentUser, isAuthenticated, isLoading } = useEnhancedAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const scrollHandler = createScrollHandler((progress) => {
      setScrollProgress(progress);
    });

    window.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Initial calculation
    const initialScrollTop = window.pageYOffset;
    const initialDocHeight = document.documentElement.scrollHeight - window.innerHeight;
    const initialProgress = Math.min((initialScrollTop / initialDocHeight) * 100, 100);
    setScrollProgress(initialProgress);

    return () => {
      window.removeEventListener('scroll', scrollHandler);
    };
  }, []);
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-12 py-2 sm:py-4 lg:py-6 backdrop-blur-md bg-background/90 shadow-sm border-b border-border/10" style={{ position: 'fixed', top: 0 }}>
      <div className="flex items-center justify-between w-full">
        {/* Logo - Left */}
        <div 
          className="flex items-center drop-shadow-sm cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <LazyImage
            src="/lovable-uploads/97f86327-e463-4091-8474-4f835ee7556f.png"
            alt="Weekly Wizdom Logo" 
            className="h-6 xs:h-7 sm:h-6 lg:h-8 w-auto drop-shadow-md"
            loading="eager"
            fetchPriority="high"
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzU1RkYiPldXPC90ZXh0Pjwvc3ZnPg=="
          />
        </div>

        {/* Desktop Navigation - Center */}
        <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 absolute left-1/2 transform -translate-x-1/2">
          <a 
            href="#services" 
            className="text-foreground hover:text-primary transition-all duration-300 font-montserrat hover:translate-y-[-1px] drop-shadow-sm hover:drop-shadow-md"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('services');
            }}
          >
            About
          </a>
          <a 
            href="#reviews" 
            className="text-foreground hover:text-primary transition-all duration-300 font-montserrat hover:translate-y-[-1px] drop-shadow-sm hover:drop-shadow-md"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('reviews');
            }}
          >
            Reviews
          </a>
          <a 
            href="#pricing" 
            className="text-foreground hover:text-primary transition-all duration-300 font-montserrat hover:translate-y-[-1px] drop-shadow-sm hover:drop-shadow-md"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('pricing');
            }}
          >
            Pricing
          </a>
          <a 
            href="#faq" 
            className="text-foreground hover:text-primary transition-all duration-300 font-montserrat hover:translate-y-[-1px] drop-shadow-sm hover:drop-shadow-md"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('faq');
            }}
          >
            FAQs
          </a>
          <a 
            href="#contact" 
            className="text-foreground hover:text-primary transition-all duration-300 font-montserrat hover:translate-y-[-1px] drop-shadow-sm hover:drop-shadow-md"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('contact');
            }}
          >
            Contact
          </a>
        </div>

        {/* Right side - Mobile menu + Sign In + Get Started */}
        <div className="flex items-center gap-1 xs:gap-2 sm:gap-3">
          {/* Mobile menu button */}
          <button 
            className="lg:hidden p-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-110 hover:translate-y-[-1px] drop-shadow-sm hover:drop-shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 drop-shadow-sm" />
          </button>
          
          {/* Conditional Sign In / Dashboard Button */}
          {!isLoading && isAuthenticated ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="font-medium font-montserrat border-[#3355FF] text-[#3355FF] hover:bg-[#3355FF] hover:text-white text-xs sm:text-sm px-3 sm:px-4 h-9 rounded-full transition-all duration-300 hover:scale-105 hover:translate-y-[-2px] shadow-[0_2px_4px_rgba(51,85,255,0.2)] hover:shadow-[0_4px_8px_rgba(51,85,255,0.3)] drop-shadow-md" 
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="font-medium font-montserrat border-[#3355FF] text-[#3355FF] hover:bg-[#3355FF] hover:text-white text-xs sm:text-sm px-3 sm:px-4 h-9 rounded-full transition-all duration-300 hover:scale-105 hover:translate-y-[-2px] shadow-[0_2px_4px_rgba(51,85,255,0.2)] hover:shadow-[0_4px_8px_rgba(51,85,255,0.3)] drop-shadow-md" 
              onClick={onAuthClick}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Sign In'}
            </Button>
          )}

          {/* Get Started CTA Button - Only show if not authenticated */}
          {!isAuthenticated && (
            <Button 
              size="sm" 
              className="font-medium font-montserrat bg-brand-primary hover:bg-background hover:text-brand-primary text-white border-2 border-brand-primary text-xs sm:text-sm px-3 sm:px-4 h-9 rounded-full relative overflow-hidden transition-all duration-300 hover:scale-105 hover:translate-y-[-2px] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] before:animate-shimmer-subtle hover:before:opacity-0" 
              onClick={() => navigateToSection('pricing')}
            >
              Get Started
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border shadow-xl transform transition-all duration-300 animate-fade-in">
          <div className="px-4 py-4 space-y-4">
            {/* Removed Sign In from mobile menu - now in header */}
            <a 
              href="#services" 
              className="block text-foreground hover:text-primary transition-all duration-300 font-montserrat hover:translate-x-2 hover:drop-shadow-sm py-2 min-h-[44px] flex items-center"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                navigateToSection('services');
              }}
            >
              About
            </a>
            <a 
              href="#reviews" 
              className="block text-foreground hover:text-primary transition-all duration-300 font-montserrat hover:translate-x-2 hover:drop-shadow-sm py-2 min-h-[44px] flex items-center"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                navigateToSection('reviews');
              }}
            >
              Reviews
            </a>
            <a 
              href="#pricing" 
              className="block text-foreground hover:text-primary transition-all duration-300 font-montserrat hover:translate-x-2 hover:drop-shadow-sm py-2 min-h-[44px] flex items-center"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                navigateToSection('pricing');
              }}
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              className="block text-foreground hover:text-primary transition-all duration-300 font-montserrat hover:translate-x-2 hover:drop-shadow-sm py-2 min-h-[44px] flex items-center"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                navigateToSection('faq');
              }}
            >
              FAQs
            </a>
            <a 
              href="#contact" 
              className="block text-foreground hover:text-primary transition-all duration-300 font-montserrat hover:translate-x-2 hover:drop-shadow-sm py-2 min-h-[44px] flex items-center"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                navigateToSection('contact');
              }}
            >
              Contact
            </a>
          </div>
        </div>
      )}
      
      {/* Mobile scroll progress bar */}
      <div className="block sm:hidden fixed top-[58px] left-0 right-0 z-[90] h-1 bg-background/20 backdrop-blur-sm" style={{ position: 'fixed', top: '58px' }}>
        <div 
          className="h-full bg-brand-primary"
          style={{ 
            width: `${scrollProgress}%`,
            opacity: scrollProgress > 0 ? 1 : 0,
            transition: 'opacity 0.3s ease-out'
          }}
        />
      </div>

      {/* Desktop/Tablet scroll progress bar - covering bottom border */}
      <div 
        className="hidden sm:block absolute bottom-[-1px] left-0 right-0 h-1"
        style={{ 
          opacity: scrollProgress > 0 ? 1 : 0
        }}
      >
        <div 
          className="h-full bg-brand-primary"
          style={{ 
            width: `${scrollProgress}%`,
            transition: 'none'
          }}
        />
      </div>
    </nav>
  );
};

export default HeroNavigation;
