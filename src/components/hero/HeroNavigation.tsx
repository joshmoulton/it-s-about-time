import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
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
  const { isAuthenticated, isLoading } = useEnhancedAuth();
  const navigate = useNavigate();
  
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur border-b border-border/40 bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
        </div>

        {/* Navigation Links - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-8">
          <a 
            href="#services" 
            className="text-base text-foreground hover:text-primary transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('services');
            }}
          >
            About
          </a>
          <a 
            href="#reviews" 
            className="text-base text-foreground hover:text-primary transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('reviews');
            }}
          >
            Reviews
          </a>
          <a 
            href="#pricing" 
            className="text-base text-foreground hover:text-primary transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('pricing');
            }}
          >
            Pricing
          </a>
          <a 
            href="#faq" 
            className="text-base text-foreground hover:text-primary transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('faq');
            }}
          >
            FAQs
          </a>
          <a 
            href="#contact" 
            className="text-base text-foreground hover:text-primary transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('contact');
            }}
          >
            Contact
          </a>
        </nav>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Dashboard/Sign In Button */}
          {!isLoading && isAuthenticated ? (
            <Button 
              variant="outline" 
              className="h-10 px-6 rounded-md text-sm font-medium"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="h-10 px-6 rounded-md text-sm font-medium"
              onClick={onAuthClick}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Sign In'}
            </Button>
          )}

          {/* Get Started Button - Only show if not authenticated */}
          {!isAuthenticated && (
            <Button 
              className="h-10 px-6 rounded-md text-sm font-medium"
              onClick={() => navigateToSection('pricing')}
            >
              Get Started
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <nav className="container px-4 py-4 space-y-2">
            <a 
              href="#services" 
              className="block py-2 text-base text-foreground hover:text-primary transition-colors duration-200"
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
              className="block py-2 text-base text-foreground hover:text-primary transition-colors duration-200"
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
              className="block py-2 text-base text-foreground hover:text-primary transition-colors duration-200"
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
              className="block py-2 text-base text-foreground hover:text-primary transition-colors duration-200"
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
              className="block py-2 text-base text-foreground hover:text-primary transition-colors duration-200"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                navigateToSection('contact');
              }}
            >
              Contact
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default HeroNavigation;
