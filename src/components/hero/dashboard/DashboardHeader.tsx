
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardHeaderProps {
  onViewDashboard: () => void;
}

const DashboardHeader = ({ onViewDashboard }: DashboardHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={`bg-slate-700 rounded-t-xl flex items-center justify-between relative z-10 ${isMobile ? 'px-4 py-3' : 'px-8 py-4'}`}>
      <div className="flex items-center gap-4">
        <div className={`bg-brand-primary rounded-lg flex items-center justify-center ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
          <div className={`bg-white rounded-sm ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`}></div>
        </div>
        <img 
          src="/lovable-uploads/566bd7e2-5b9d-40e6-90b4-3e3022ecd43d.png" 
          alt="Weekly Wizdom" 
          className={`${isMobile ? 'h-7' : 'h-10'} w-auto`}
        />
      </div>
      {!isMobile && (
        <div className="flex items-center gap-3">
          <Button onClick={onViewDashboard} className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105">
            View Dashboard Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
