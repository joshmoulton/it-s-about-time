import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { navigateToSection } from '@/utils/hashNavigation';
import { createScrollHandler } from '@/utils/smoothScroll';

interface HeaderProps {
  onAuthClick: () => void;
  onPremiumClick?: () => void;
}

const nav = [
  { label: "About", href: "#about", key: "services" },
  { label: "Reviews", href: "#reviews", key: "reviews" },
  { label: "Pricing", href: "#pricing", key: "pricing" },
  { label: "FAQs", href: "#faq", key: "faq" },
  { label: "Contact", href: "#contact", key: "contact" },
];

export default function Header({ onAuthClick, onPremiumClick }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
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
    <header className="sticky top-0 z-50 w-full backdrop-blur border-b border-border/40 bg-background/80">
      <div className="container relative flex h-16 items-center px-4">
        {/* Logo - Left positioned */}
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Home"
        >
          <div className="h-10 w-10 rounded-md bg-brand-primary grid place-items-center">
            <span className="text-white font-semibold text-lg leading-none">W</span>
          </div>
        </div>

        {/* Desktop nav - Absolutely centered */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {nav.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="text-base text-foreground hover:text-primary transition-colors duration-200"
              onClick={(e) => {
                e.preventDefault();
                navigateToSection(n.key);
              }}
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Right buttons - Right positioned */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Dashboard/Sign In Button */}
          {!isLoading && isAuthenticated ? (
            <Button
              variant="outline"
              className="h-10 px-6 rounded-md text-sm font-medium border-input"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-10 px-6 rounded-md text-sm font-medium border-input"
              onClick={onAuthClick}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Sign In'}
            </Button>
          )}

          {/* Get Started Button - Only show if not authenticated */}
          {!isAuthenticated && (
            <Button 
              className="h-10 px-6 rounded-md text-sm font-medium bg-brand-primary"
              onClick={() => navigateToSection('pricing')}
            >
              Get Started
            </Button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden ml-1 h-10 w-10 grid place-items-center rounded-md text-foreground hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur px-4 pb-4">
          <nav className="flex flex-col">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  navigateToSection(n.key);
                }}
                className="py-3 text-base text-foreground hover:text-primary transition-colors"
              >
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* Mobile scroll progress bar */}
      <div className="block sm:hidden fixed top-[65px] left-0 right-0 z-40 h-1 bg-background/20 backdrop-blur-sm">
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
    </header>
  );
}