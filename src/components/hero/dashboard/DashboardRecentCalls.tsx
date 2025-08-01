
import { Star } from "lucide-react";

const DashboardRecentCalls = () => {
  const calls = [
    { symbol: 'BTC', name: 'Bitcoin', gain: '+23%', days: '2 days ago', profit: '$2,847' },
    { symbol: 'SOL', name: 'Solana', gain: '+45%', days: '5 days ago', profit: '$1,924' },
    { symbol: 'NVDA', name: 'Nvidia', gain: '+52%', days: '6 days ago', profit: '$4,235' },
    { symbol: 'TSLA', name: 'Tesla', gain: '+31%', days: '3 days ago', profit: '$3,156' }
  ];

  return (
    <div className="col-span-2">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-slate-200">Recent Winning Calls</h4>
        <div className="flex items-center gap-2 text-brand-secondary text-sm">
          <Star className="h-4 w-4 fill-current" />
          <span>Verified Results</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {calls.map((call, index) => (
          <div key={index} className="bg-slate-800/80 rounded-xl p-4 border border-slate-600/60 backdrop-blur-sm hover:border-brand-primary/40 transition-all duration-200 hover:scale-105 cursor-pointer group">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <span className="text-white text-sm font-bold">{call.symbol}</span>
              </div>
            </div>
            <div className="text-brand-secondary font-bold text-lg mb-1">{call.gain}</div>
            <div className="text-white text-sm font-medium mb-1">{call.name}</div>
            <div className="text-slate-400 text-xs mb-1">{call.days}</div>
            <div className="text-brand-secondary text-xs font-semibold">+{call.profit}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardRecentCalls;
