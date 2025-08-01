import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CyclingText from "@/components/ui/cycling-text";

interface ImprovedHeroContentProps {
  onAuthClick: () => void;
}

const ImprovedHeroContent = ({
  onAuthClick
}: ImprovedHeroContentProps) => {
  const cyclingWords = ['Crypto', 'Stocks', 'Macro', 'Commodities', 'Web3', 'Memes', 'Equities', 'DeFi'];

  return <div className="space-y-6 text-center lg:text-left mt-16 lg:mt-24">
      {/* Main Headline - Larger size and more stacked */}
      <div className="space-y-4">
        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-medium text-[#081426] leading-tight font-merriweather">
          <span className="text-[#081426]">
            Join the #1 Newsletter & Community for{' '}
            <span className="inline-block w-48 lg:w-56 xl:w-64 text-left">
              <CyclingText 
                words={cyclingWords} 
                className="text-[#3355FF] font-bold"
                interval={2500}
              />
            </span>
          </span>
        </h1>
        
        {/* Subheading */}
        <p className="text-2xl lg:text-3xl text-[#081426] font-medium leading-relaxed font-merriweather">Get actionable insights from crypto, equity, commodities and more every week. Trusted by 1,000s of serious investors.</p>
      </div>

      {/* Social Proof Section */}
      <div className="mt-8 lg:mt-12 text-center lg:text-left">
        <div className="relative inline-flex items-center gap-3 bg-[#081426] border border-border/50 rounded-full px-6 py-3 shadow-md overflow-hidden before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-200%] before:animate-[shimmer-subtle_6s_ease-in-out_infinite] before:pointer-events-none">
          <span className="text-white font-montserrat text-xl font-semibold">Join 1,000s of other traders</span>
        </div>
      </div>

      {/* CTA Button - Positioned below social proof */}
      <div className="mt-6 lg:mt-8">
        <Button onClick={onAuthClick} size="lg" className="h-12 px-8 text-base font-bold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl font-montserrat bg-[#3355FF] hover:bg-[#2244EE] text-white relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700">
          Get Started Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>;
};

export default ImprovedHeroContent;
