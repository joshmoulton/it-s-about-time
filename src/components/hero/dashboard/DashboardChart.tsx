
import { TrendingUp } from "lucide-react";

const DashboardChart = () => {
  const chartData = [65, 72, 58, 84, 92, 78, 95, 88, 103, 97, 115, 128, 135, 142, 138, 145, 152, 148, 156, 164];

  return (
    <div className="col-span-1">
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-600/60 backdrop-blur-sm h-full hover:border-brand-primary/40 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-200">12-Month Growth</span>
          <span className="text-sm font-semibold text-brand-secondary bg-brand-primary/20 px-3 py-1 rounded-full flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +142%
          </span>
        </div>
        <div className="flex items-end gap-1 h-24 mb-4">
          {chartData.map((height, i) => (
            <div 
              key={i} 
              className="bg-gradient-to-t from-brand-primary/80 to-brand-secondary/90 rounded-t-sm flex-1 transition-all duration-500 hover:from-brand-secondary/80 hover:to-brand-primary cursor-pointer" 
              style={{ height: `${height / 164 * 100}%` }} 
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-400 mb-3">
          <span>Jan 2024</span>
          <span>Dec 2024</span>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-300 mb-2">Member Success Rate</div>
          <div className="text-lg font-bold text-brand-secondary">96% Profitable</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardChart;
