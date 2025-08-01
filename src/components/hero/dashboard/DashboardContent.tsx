
import { TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardStats from "./DashboardStats";
import DashboardRecentCalls from "./DashboardRecentCalls";
import DashboardChart from "./DashboardChart";
import DashboardMobile from "./DashboardMobile";
import { FreemiumWidgetWrapper } from "@/components/freemium/FreemiumWidgetWrapper";
import DashboardNewsletters from "./DashboardNewsletters";
import DashboardAlerts from "./DashboardAlerts";

interface DashboardContentProps {
  onViewDashboard: () => void;
}

const DashboardContent = ({ onViewDashboard }: DashboardContentProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={`relative bg-slate-900 rounded-b-xl overflow-hidden z-10 flex-1 flex flex-col ${isMobile ? 'p-3' : 'p-4 lg:p-6'}`}>
      {/* Weekly Wizdom blue gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/15 via-brand-secondary/10 to-brand-accent/20 pointer-events-none"></div>
      
      {/* Header with enhanced CTA - Compact for widescreen */}
      <div className={`relative flex items-center justify-between flex-shrink-0 ${isMobile ? 'mb-3' : 'mb-4'}`}>
        <h3 className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-xl lg:text-2xl'}`}>Live Performance Tracking</h3>
        <div className={`flex gap-2 items-center bg-brand-primary/20 rounded-full border border-brand-primary/30 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'} hover:bg-brand-primary/25 transition-all duration-200 cursor-pointer`}>
          <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse"></div>
          <span className={`font-medium text-brand-secondary ${isMobile ? 'text-xs' : 'text-sm'}`}>87% Win Rate</span>
          <TrendingUp className="h-3 w-3 text-brand-secondary" />
        </div>
      </div>
      
      {/* Enhanced Performance Stats - More compact for widescreen */}
      <div className="flex-shrink-0 mb-3">
        <div className="grid grid-cols-2 gap-4">
          <FreemiumWidgetWrapper
            featureName="newsletter content"
            widgetType="newsletter"
            gradientTheme="blue"
            className="h-[300px] overflow-hidden"
          >
            <DashboardNewsletters />
          </FreemiumWidgetWrapper>
          
          <FreemiumWidgetWrapper
            featureName="live trading alerts"
            widgetType="alerts"
            gradientTheme="orange"
            className="h-[300px] overflow-hidden"
          >
            <DashboardAlerts />
          </FreemiumWidgetWrapper>
        </div>
        <DashboardStats />
      </div>

      {/* Enhanced Recent Calls and Chart - Optimized for widescreen */}
      {!isMobile ? (
        <div className="relative grid grid-cols-3 gap-4 flex-1 min-h-0">
          <FreemiumWidgetWrapper
            featureName="recent winning calls"
            widgetType="trading_signals"
            gradientTheme="green"
            className="col-span-2 h-[340px] overflow-hidden"
          >
            <DashboardRecentCalls />
          </FreemiumWidgetWrapper>
          
          <FreemiumWidgetWrapper
            featureName="performance chart"
            widgetType="analytics"
            gradientTheme="purple"
            className="col-span-1 h-[340px] overflow-hidden"
          >
            <DashboardChart />
          </FreemiumWidgetWrapper>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <DashboardMobile onViewDashboard={onViewDashboard} />
        </div>
      )}
    </div>
  );
};

export default DashboardContent;
