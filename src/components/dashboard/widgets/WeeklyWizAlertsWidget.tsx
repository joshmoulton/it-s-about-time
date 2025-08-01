import React, { useEffect, useState } from 'react';

const WeeklyWizAlertsWidget = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [alertData, setAlertData] = useState<any>(null);

  useEffect(() => {
    // Listen for messages from the widget
    const handleMessage = (event: any) => {
      if (event.data.type === 'weeklyWizAlertsLoaded') {
        setIsLoaded(true);
        setAlertData(event.data);
        console.log('📊 Real-time alerts loaded:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="alerts-widget-container">
      <div className="widget-header">
        <h2>🧙‍♂️ Live Trading Alerts</h2>
        {isLoaded && alertData && (
          <div className="widget-status">
            <span className="live-indicator">🟢 LIVE</span>
            <span className="alert-count">{alertData.totalTrades} Active</span>
            <span className="last-update">
              Updated: {new Date(alertData.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
      
      <iframe 
        src="https://tcchfpgmwqawcjtwicek.supabase.co/functions/v1/active-trades-widget"
        width="100%" 
        height="600"
        frameBorder="0"
        scrolling="auto"
        allow="autoplay; encrypted-media"
        sandbox="allow-scripts allow-same-origin allow-forms"
        loading="lazy"
        title="Weekly Wiz Alerts - Live Trading Data"
        style={{
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          background: '#111827'
        }}
      />
    </div>
  );
};

export default WeeklyWizAlertsWidget;