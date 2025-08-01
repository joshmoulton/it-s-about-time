
import { TrendingUp, DollarSign, Target, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardStats = () => {
  const isMobile = useIsMobile();

  const stats = [
    {
      icon: TrendingUp,
      label: "Monthly Return",
      value: "+24.7%",
      change: "+5.2%",
      positive: true
    },
    {
      icon: DollarSign,
      label: "Portfolio Value",
      value: "$127,435",
      change: "+$8,750",
      positive: true
    },
    {
      icon: Target,
      label: "Win Rate",
      value: "87%",
      change: "+3%",
      positive: true
    },
    {
      icon: Users,
      label: "Active Signals",
      value: "12",
      change: "+2",
      positive: true
    }
  ];

  return (
    <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`relative bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 ${isMobile ? 'p-2' : 'p-3'} hover:bg-slate-800/70 transition-all duration-200`}
          >
            {/* Brand gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 rounded-lg"></div>
            
            <div className="relative flex items-center gap-2">
              <div className="flex-shrink-0">
                <Icon className={`text-brand-secondary ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-slate-400 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>{stat.label}</p>
                <div className="flex items-center gap-1">
                  <p className={`text-white font-bold ${isMobile ? 'text-sm' : 'text-base'}`}>{stat.value}</p>
                  <span className={`text-xs font-medium ${stat.positive ? 'text-brand-secondary' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
