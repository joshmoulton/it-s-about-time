
export const getWidgetStyles = (): string => {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #111827;
      color: white;
      padding: 16px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 100%;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #374151;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .widget-icon {
      font-size: 24px;
    }
    
    .widget-title {
      font-size: 20px;
      font-weight: 600;
      color: white;
    }
    
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .live-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .live-text {
      color: #10b981;
      font-size: 12px;
      font-weight: 500;
    }
    
    .alerts-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    
    .alerts-column {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid #374151;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .column-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: rgba(15, 23, 42, 0.8);
      border-bottom: 1px solid #374151;
    }
    
    .column-icon {
      font-size: 16px;
    }
    
    .column-title {
      font-size: 14px;
      font-weight: 500;
      color: white;
      flex: 1;
    }
    
    .column-count {
      background: #3b82f6;
      color: white;
      font-size: 12px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 4px;
      min-width: 20px;
      text-align: center;
    }
    
    .trades-list {
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .trade-item {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid #374151;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
    }
    
    .trade-item:last-child {
      margin-bottom: 0;
    }
    
    .trade-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .symbol-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .symbol {
      font-size: 14px;
      font-weight: 600;
      color: white;
    }
    
    .status {
      font-size: 10px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    
    .status.long {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }
    
    .status.pending {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
    }
    
    .trader {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .price-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    
    .price-col {
      text-align: center;
    }
    
    .price-label {
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    
    .price-value {
      font-size: 11px;
      font-weight: 600;
    }
    
    .price-value.stop-loss {
      color: #ef4444;
    }
    
    .price-value.entry {
      color: #3b82f6;
    }
    
    .price-value.target {
      color: #fbbf24;
    }
    
    .price-value.take-profit {
      color: #22c55e;
    }
    
    .empty-section {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
      font-size: 14px;
    }
    
    .widget-footer {
      text-align: center;
      margin-top: 20px;
      color: #64748b;
      font-size: 11px;
    }
    
    /* Scrollbar styling */
    .trades-list::-webkit-scrollbar {
      width: 4px;
    }
    
    .trades-list::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .trades-list::-webkit-scrollbar-thumb {
      background: #374151;
      border-radius: 2px;
    }
    
    .trades-list::-webkit-scrollbar-thumb:hover {
      background: #4b5563;
    }
    
    @media (max-width: 768px) {
      .alerts-layout {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      body {
        padding: 12px;
      }
      
      .header {
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }
      
      .price-grid {
        gap: 4px;
      }
      
      .price-value {
        font-size: 10px;
      }
    }
    
    @media (max-width: 480px) {
      .symbol-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      
      .trade-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `;
};
