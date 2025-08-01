import { Bell, TrendingUp, AlertTriangle } from "lucide-react";

const DashboardAlerts = () => {
  const alerts = [
    { 
      symbol: 'BTC', 
      type: 'ENTRY',
      message: 'Price target reached: $67,500', 
      time: '2m ago',
      priority: 'high',
      status: 'active'
    },
    { 
      symbol: 'SOL', 
      type: 'STOP',
      message: 'Stop loss triggered at $145.20', 
      time: '15m ago',
      priority: 'medium',
      status: 'executed'
    },
    { 
      symbol: 'ETH', 
      type: 'PROFIT',
      message: 'Take profit level 1 hit: $3,280', 
      time: '1h ago',
      priority: 'high',
      status: 'executed'
    },
    { 
      symbol: 'NVDA', 
      type: 'ENTRY',
      message: 'Entry signal confirmed: $125.50', 
      time: '2h ago',
      priority: 'medium',
      status: 'pending'
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'ENTRY': return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case 'STOP': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'PROFIT': return <TrendingUp className="h-4 w-4 text-green-400" />;
      default: return <Bell className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'executed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-primary" />
          Live Alerts
          <div className="bg-red-500/20 rounded-full px-2 py-1 border border-red-500/30">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          </div>
        </h4>
        <div className="flex items-center gap-2 text-brand-secondary text-sm">
          <span className="font-medium">12 Active</span>
        </div>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto">
        {alerts.map((alert, index) => (
          <div key={index} className="bg-slate-800/80 rounded-xl p-4 border border-slate-600/60 hover:border-brand-primary/40 transition-all duration-200 group">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{alert.symbol}</span>
                    <span className="text-xs bg-slate-700/50 px-2 py-1 rounded text-slate-400">
                      {alert.type}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-2">
                  {alert.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{alert.time}</span>
                  {alert.priority === 'high' && (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span className="text-xs text-red-400 font-medium">High Priority</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <button className="w-full bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-secondary text-sm font-medium py-3 rounded-xl transition-all duration-200 border border-brand-primary/30 hover:border-brand-primary/50">
          View All Alerts
        </button>
      </div>
    </div>
  );
};

export default DashboardAlerts;