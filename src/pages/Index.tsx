
import { useState, lazy, Suspense, useEffect } from "react";
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import AuthOptionsModal from "@/components/AuthOptionsModal";
import PremiumPricingModal from "@/components/PremiumPricingModal";
import ReorganizedHeroSection from "@/components/ReorganizedHeroSection";
import FeaturesRowSection from "@/components/FeaturesRowSection";
import PricingSection from "@/components/PricingSection";
import { SEOManager, generateStructuredData } from "@/components/SEOManager";
import { useHashNavigation } from "@/hooks/useHashNavigation";
import { navigateToSection } from "@/utils/hashNavigation";
import { useNavigate, useLocation } from "react-router-dom";

// Lazy load components below the fold with optimized loading
const KOLTestimonialSection = lazy(() => 
  import("@/components/KOLTestimonialSection").then(module => ({ 
    default: module.default 
  }))
);
const AboutSection = lazy(() => 
  import("@/components/AboutSection").then(module => ({ 
    default: module.default 
  }))
);
const TestimonialsSection = lazy(() => 
  import("@/components/TestimonialsSection").then(module => ({ 
    default: module.default 
  }))
);
const FAQSection = lazy(() => 
  import("@/components/FAQSection").then(module => ({ 
    default: module.default 
  }))
);
const ContactSection = lazy(() => 
  import("@/components/ContactSection").then(module => ({ 
    default: module.default 
  }))
);
const Footer = lazy(() => 
  import("@/components/Footer").then(module => ({ 
    default: module.default 
  }))
);

const Index = () => {
  const { subscriber, isAuthenticated } = useEnhancedAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize hash navigation
  useHashNavigation();

  // Expose emergency opener and log state
  useEffect(() => {
    (window as any).__openPremium = () => setPremiumModalOpen(true);
    console.debug('[premium] premiumModalOpen=', premiumModalOpen);
  }, [premiumModalOpen]);

  // Open premium modal on landing page when ?open=1 or ?open=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isOpen = params.get('open') === '1' || params.get('open') === 'true';
    setPremiumModalOpen(isOpen);
  }, [location.search]);

  // Scroll to top when premium modal opens to avoid off-screen positioning
  useEffect(() => {
    if (premiumModalOpen) {
      window.scrollTo(0, 0);
    }
  }, [premiumModalOpen]);

  // Safety: ensure body/html scroll are never left locked
  useEffect(() => {
    const unlock = () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
    unlock();
    return unlock;
  }, [authModalOpen, premiumModalOpen]);
  // Generate structured data for the homepage
  const homepageStructuredData = generateStructuredData('Organization', {
    name: 'Weekly Wizdom',
    description: 'Join the #1 cross-asset Newsletter & Community. Get notified as soon as our analysts share new ideas, get market analysis and updates every week, and track everything in our proprietary dashboard.',
    url: window.location.origin
  });

  return <>
    {/* SEO Manager for dynamic meta tags */}
    <SEOManager 
      title="Weekly Wizdom - Premium Trading Community"
      description="Join the #1 cross-asset Newsletter & Community. Get notified as soon as our analysts share new ideas, get market analysis and updates every week, and track everything in our proprietary dashboard."
      keywords="trading, cryptocurrency, market analysis, investment, financial insights, trading signals, premium community"
      image="/lovable-uploads/41a57ccc-0a24-4abd-89b1-3c41c3cc3d08.png"
      structuredData={homepageStructuredData}
    />

    
    <div className="min-h-screen bg-background relative overflow-x-hidden" style={{
      minHeight: '100vh',
      WebkitOverflowScrolling: 'touch'
    }}>
      <PremiumPricingModal 
        open={premiumModalOpen} 
        onOpenChange={(open) => {
          setPremiumModalOpen(open);
          if (!open) {
            const url = new URL(window.location.href);
            url.searchParams.delete('open');
            navigate(url.pathname + url.search, { replace: true });
          }
        }} 
      />

      {/* 1. Navigation (built into hero) + 2. Hero + Dashboard Preview (two-column layout) */}
      <ReorganizedHeroSection 
        onAuthClick={() => !isAuthenticated && setAuthModalOpen(true)} 
        onPremiumClick={() => navigateToSection('pricing')} 
      />
      
      {/* 3. Services/Features Row (directly under hero) */}
      <div id="services">
        <FeaturesRowSection />
      </div>
      
      {/* 4. KOL Testimonial */}
      <Suspense fallback={<div className="h-32 bg-muted/20" />}>
        <KOLTestimonialSection />
      </Suspense>

      {/* 4.5. Get Started CTA */}
      <section className="py-4 bg-gradient-to-br from-background to-muted/30 relative z-10">
        <div className="max-w-screen-xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-12 text-center">
          <h3 className="font-merriweather text-2xl sm:text-3xl font-bold mb-6 text-foreground">Ready to make smarter financial decisions?</h3>
          <Button onClick={() => navigateToSection('pricing')} size="lg" className="font-bold rounded-full transition-all duration-300 font-mono bg-brand-primary hover:bg-background hover:text-brand-primary text-white border-2 border-brand-primary w-full sm:w-auto min-w-[280px] xs:min-w-[300px] max-w-[340px] relative overflow-hidden hover:scale-105 hover:translate-y-[-2px] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] before:animate-shimmer-subtle hover:before:opacity-0 drop-shadow-lg touch-manipulation mx-auto min-h-[48px] xs:min-h-[52px] sm:h-12 md:h-14 px-6 xs:px-7 sm:px-8 text-sm xs:text-base sm:text-base">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </section>

      {/* 5. Video Testimonials */}
      <Suspense fallback={<div className="h-40 bg-muted/20" />}>
        <TestimonialsSection />
      </Suspense>

      {/* 6. About Section - What is Weekly Wizdom */}
      <div id="about">
        <Suspense fallback={<div className="h-48 bg-muted/20" />}>
          <AboutSection />
        </Suspense>
      </div>

      {/* 7. Custom KOL Testimonial */}
      <Suspense fallback={<div className="h-32 bg-muted/20" />}>
        <KOLTestimonialSection variant="custom" />
      </Suspense>

      {/* 8. Reviews/Testimonials - Commented out for now */}
      {/* <div id="reviews">
        <TestimonialsSection />
       </div> */}
      
      {/* 9. Premium Section */}
      <div id="pricing">
        <Suspense fallback={<div className="h-64 bg-muted/20" />}>
          <PricingSection onOpenPremiumModal={() => navigate('/pricing?open=1')} />
        </Suspense>
      </div>

      {/* 10. Third KOL Testimonial */}
      <Suspense fallback={<div className="h-32 bg-muted/20" />}>
        <KOLTestimonialSection variant="monkey" />
      </Suspense>

      {/* 11. FAQ Section */}
      <div id="faq">
        <Suspense fallback={<div className="h-40 bg-muted/20" />}>
          <FAQSection />
        </Suspense>
      </div>

      {/* 12. Contact Section */}
      <div id="contact">
        <Suspense fallback={<div className="h-32 bg-muted/20" />}>
          <ContactSection />
        </Suspense>
      </div>
      
      {/* 13. Footer */}
      <Suspense fallback={<div className="h-24 bg-muted/20" />}>
        <Footer />
      </Suspense>
    </div>
  </>;
};

export default Index;
