
import { TradeAlert } from './types.ts';
import { getWidgetStyles } from './styles.ts';

export const generateStyledHTML = (alerts: TradeAlert[]): string => {
  // Separate active and awaiting alerts
  const activeAlerts = alerts.filter(alert => alert.entry_activated !== false);
  const awaitingAlerts = alerts.filter(alert => alert.entry_activated === false);
  
  const generateTradeCard = (alert: TradeAlert, isAwaiting = false) => {
    const statusBadge = isAwaiting ? 'PENDING' : 'LONG';
    const statusClass = isAwaiting ? 'pending' : 'long';
    
    if (isAwaiting) {
      return `
        <div class="trade-item">
          <div class="trade-row">
            <div class="symbol-section">
              <span class="symbol">${alert.symbol}</span>
              <span class="status ${statusClass}">${statusBadge}</span>
            </div>
            <span class="trader">${alert.trader}</span>
          </div>
          <div class="price-grid">
            <div class="price-col">
              <div class="price-label">SL</div>
              <div class="price-value stop-loss">$${alert.stop_loss_price?.toFixed(2) || 'N/A'}</div>
            </div>
            <div class="price-col">
              <div class="price-label">Target</div>
              <div class="price-value target">$${alert.entry_price.toFixed(2)}</div>
            </div>
            <div class="price-col">
              <div class="price-label">TP</div>
              <div class="price-value take-profit">$${alert.take_profit_price?.toFixed(2) || 'N/A'}</div>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="trade-item">
          <div class="trade-row">
            <div class="symbol-section">
              <span class="symbol">${alert.symbol}</span>
              <span class="status ${statusClass}">${statusBadge}</span>
            </div>
            <span class="trader">${alert.trader}</span>
          </div>
          <div class="price-grid">
            <div class="price-col">
              <div class="price-label">SL</div>
              <div class="price-value stop-loss">$${alert.stop_loss_price?.toFixed(2) || 'N/A'}</div>
            </div>
            <div class="price-col">
              <div class="price-label">Entry</div>
              <div class="price-value entry">$${alert.entry_price.toFixed(2)}</div>
            </div>
            <div class="price-col">
              <div class="price-label">TP</div>
              <div class="price-value take-profit">$${alert.take_profit_price?.toFixed(2) || 'N/A'}</div>
            </div>
          </div>
        </div>
      `;
    }
  };

  const activeTradesHTML = activeAlerts.length > 0 ? activeAlerts.map(alert => generateTradeCard(alert, false)).join('') : 
    '<div class="empty-section">No active positions</div>';
    
  const awaitingTradesHTML = awaitingAlerts.length > 0 ? awaitingAlerts.map(alert => generateTradeCard(alert, true)).join('') : 
    '<div class="empty-section">No awaiting entries</div>';

  const timestamp = Date.now();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Wiz Live Alerts - v3.0.0</title>
    <meta name="cache-control" content="no-cache, no-store, must-revalidate">
    <meta name="pragma" content="no-cache">
    <meta name="expires" content="0">
    <style>
        ${getWidgetStyles()}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <div class="widget-icon">🚨</div>
                <h1 class="widget-title">Live Alerts</h1>
            </div>
            <div class="live-indicator">
                <div class="live-dot"></div>
                <span class="live-text">LIVE</span>
            </div>
        </div>
        
        <div class="alerts-layout">
            <div class="alerts-column">
                <div class="column-header">
                    <span class="column-icon">📈</span>
                    <span class="column-title">Active Positions</span>
                    <span class="column-count">${activeAlerts.length}</span>
                </div>
                <div class="trades-list">
                    ${activeTradesHTML}
                </div>
            </div>
            
            <div class="alerts-column">
                <div class="column-header">
                    <span class="column-icon">⏳</span>
                    <span class="column-title">Awaiting Entry</span>
                    <span class="column-count">${awaitingAlerts.length}</span>
                </div>
                <div class="trades-list">
                    ${awaitingTradesHTML}
                </div>
            </div>
        </div>
        
        <div class="widget-footer">
            <small>v3.0.0 | Last updated: ${new Date().toLocaleTimeString()}</small>
        </div>
    </div>
    
    <script>
        console.log('🧙‍♂️ Weekly Wiz Alerts Widget v3.0.0 loaded at:', new Date().toISOString());
        console.log('📊 Active alerts:', ${activeAlerts.length}, 'Awaiting alerts:', ${awaitingAlerts.length});
        
        // Send data to parent window
        if (window.parent) {
            window.parent.postMessage({
                type: 'weeklyWizAlertsLoaded',
                totalTrades: ${activeAlerts.length + awaitingAlerts.length},
                activeTrades: ${activeAlerts.length},
                awaitingTrades: ${awaitingAlerts.length},
                timestamp: new Date().toISOString()
            }, '*');
        }
        
        // Auto-refresh every 15 seconds when visible, 1 minute when hidden
        let refreshInterval = 15000;
        
        const refresh = () => {
            console.log('🔄 Auto-refreshing widget...');
            window.location.reload();
        };
        
        // Check if page is visible
        const handleVisibilityChange = () => {
            if (document.hidden) {
                refreshInterval = 60000; // 1 minute when hidden
            } else {
                refreshInterval = 15000; // 15 seconds when visible
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Set initial refresh
        setTimeout(refresh, refreshInterval);
        
        // Debug info
        console.log('Widget timestamp:', ${timestamp});
        console.log('Refresh interval:', refreshInterval + 'ms');
    </script>
</body>
</html>`;
};

// Helper function to determine progress width class
function getProgressWidthClass(percentage: number): string {
  if (percentage <= 5) return 'width-5';
  if (percentage <= 10) return 'width-10';
  if (percentage <= 15) return 'width-15';
  if (percentage <= 20) return 'width-20';
  if (percentage <= 25) return 'width-25';
  if (percentage <= 30) return 'width-30';
  if (percentage <= 35) return 'width-35';
  if (percentage <= 40) return 'width-40';
  if (percentage <= 45) return 'width-45';
  if (percentage <= 50) return 'width-50';
  if (percentage <= 55) return 'width-55';
  if (percentage <= 60) return 'width-60';
  if (percentage <= 65) return 'width-65';
  if (percentage <= 70) return 'width-70';
  if (percentage <= 75) return 'width-75';
  if (percentage <= 80) return 'width-80';
  if (percentage <= 85) return 'width-85';
  if (percentage <= 90) return 'width-90';
  if (percentage <= 95) return 'width-95';
  return 'width-100';
}
