
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

interface DashboardMobileProps {
  onViewDashboard: () => void;
}

const DashboardMobile = ({ onViewDashboard }: DashboardMobileProps) => {
  const calls = [
    { symbol: 'BTC', gain: '+23%', profit: '+$2.8k' },
    { symbol: 'SOL', gain: '+45%', profit: '+$1.9k' },
    { symbol: 'NVDA', gain: '+52%', profit: '+$4.2k' },
    { symbol: 'TSLA', gain: '+31%', profit: '+$3.1k' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">Recent Wins</h4>
        <div className="flex items-center gap-1 text-brand-secondary text-xs">
          <Star className="h-3 w-3 fill-current" />
          <span>Verified</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {calls.map((call, index) => (
          <div key={index} className="bg-slate-800/80 rounded-lg p-3 border border-slate-600/60 hover:border-brand-primary/40 transition-all duration-200">
            <div className={`w-6 h-6 bg-gradient-to-br from-brand-primary to-brand-secondary rounded flex items-center justify-center mb-2`}>
              <span className="text-white text-xs font-bold">{call.symbol}</span>
            </div>
            <div className="text-brand-secondary font-bold text-sm mb-1">{call.gain}</div>
            <div className="text-brand-secondary text-xs">{call.profit}</div>
          </div>
        ))}
      </div>
      
      {/* Mobile CTA Button */}
      <div className="text-center pt-4">
        <Button onClick={onViewDashboard} className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105">
          Get Free Access Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DashboardMobile;
