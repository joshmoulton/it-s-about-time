
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "./Header";
import DynamicHeroBackground from "./DynamicHeroBackground";
import CyclingText from "@/components/ui/cycling-text";
import { navigateToSection } from "@/utils/hashNavigation";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { useNavigate } from "react-router-dom";

interface ReorganizedHeroSectionProps {
  onAuthClick: () => void;
  onPremiumClick: () => void;
}

const ReorganizedHeroSection = ({
  onAuthClick,
  onPremiumClick
}: ReorganizedHeroSectionProps) => {
  const cyclingWords = ['Crypto', 'Stocks', 'Macro', 'Web3', 'Memes', 'Equities', 'DeFi'];
  const { isAuthenticated } = useEnhancedAuth();
  const navigate = useNavigate();
  
  return (
    <section 
      className="relative overflow-hidden bg-background hero-section" 
      style={{ 
        minHeight: '100vh',
        height: 'auto'
      }}
    >
      {/* Dynamic Animated Background */}
      <DynamicHeroBackground />

      {/* Top Navigation */}
      <Header />

      {/* Two-Column Hero Content */}
      <div className="relative z-10 pt-16 xs:pt-20 sm:pt-20 pb-8 sm:pb-16 lg:pt-28 lg:pb-32">
        <div className="flex flex-col max-w-[1200px] mx-auto px-3 xs:px-4 sm:px-6 min-h-[calc(100vh-120px)] justify-center">
            
            {/* Centered Hero Text */}
            <div className="flex flex-col space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8 py-6 sm:py-6 lg:py-12 text-center items-center justify-center">
              {/* Main Headline */}
              <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.5rem] 2xl:text-[4.75rem] leading-[1.2] font-medium text-foreground font-merriweather drop-shadow-lg max-w-5xl px-2 sm:px-0">
                <span className="text-foreground drop-shadow-md">
                  Join the #1 Newsletter & Community for{' '}
                  <span className="relative inline-block min-w-[120px] text-left">
                    <CyclingText words={cyclingWords} className="text-brand-primary font-bold" interval={2500} />
                  </span>
                </span>
              </h1>
              
              {/* Subheading */}
              <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl leading-[1.4] mt-3 sm:mt-3 text-brand-muted-text font-medium font-merriweather drop-shadow-sm max-w-2xl mx-auto px-3 sm:px-0">
                Get Notified. Get Trading. Start Winning.
              </p>

              {/* Buttons Section */}
              <div className="flex flex-col gap-3 sm:gap-4 mt-4 sm:mt-6 items-center w-full max-w-sm sm:max-w-none mx-auto px-4 sm:px-0">
                {/* CTA Button - Different for authenticated vs non-authenticated users */}
                {isAuthenticated ? (
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    size="lg" 
                     className="font-bold rounded-full transition-all duration-300 font-montserrat bg-brand-primary hover:bg-background hover:text-brand-primary text-white border-2 border-brand-primary w-full sm:w-auto min-w-[280px] xs:min-w-[300px] max-w-[340px] relative overflow-hidden sm:hover:scale-105 sm:hover:translate-y-[-2px] drop-shadow-lg touch-manipulation min-h-[48px] xs:min-h-[52px] sm:h-12 md:h-14 px-6 xs:px-7 sm:px-8 text-sm xs:text-base sm:text-base"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-4 sm:w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigateToSection('pricing')}
                    size="lg" 
                    className="font-bold rounded-full transition-all duration-300 font-montserrat bg-brand-primary hover:bg-background hover:text-brand-primary text-white border-2 border-brand-primary w-full sm:w-auto min-w-[280px] xs:min-w-[300px] max-w-[340px] relative overflow-hidden sm:hover:scale-105 sm:hover:translate-y-[-2px] drop-shadow-lg touch-manipulation min-h-[48px] xs:min-h-[52px] sm:h-12 md:h-14 px-6 xs:px-7 sm:px-8 text-sm xs:text-base sm:text-base"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-4 sm:w-4" />
                  </Button>
                )}
                
                {/* Social Proof */}
                <p className="text-sm xs:text-base sm:text-base md:text-lg text-foreground/80 font-medium font-merriweather mt-1 sm:mt-2">
                  Trusted by 24,000+ serious investors
                </p>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default ReorganizedHeroSection;
