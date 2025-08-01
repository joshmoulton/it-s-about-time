
import { TradeAlert } from './types.ts';

export const generateDemoTradeAlerts = (): TradeAlert[] => {
  const symbols = ['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT', 'MATIC/USDT', 'LINK/USDT'];
  const traders = ['Foxy', 'Daniel', 'ActiveTrader', 'CryptoKing', 'TradeMaster'];
  const alerts: TradeAlert[] = [];
  
  for (let i = 0; i < 6; i++) {
    const entryPrice = 0.5 + Math.random() * 5;
    const variation = (Math.random() - 0.5) * 0.6;
    const currentPrice = Math.max(0.01, entryPrice * (1 + variation));
    const profitLoss = (currentPrice - entryPrice) * 100;
    const profitPercentage = ((currentPrice - entryPrice) / entryPrice) * 100;
    
    alerts.push({
      id: `trade-${i + 1}`,
      symbol: symbols[i],
      trader: traders[i % traders.length],
      entry_price: entryPrice,
      current_price: currentPrice,
      profit_loss: profitLoss,
      profit_percentage: profitPercentage,
      stop_loss_price: Math.random() > 0.5 ? entryPrice * 0.95 : undefined,
      take_profit_price: Math.random() > 0.5 ? entryPrice * 1.2 : undefined,
    });
  }
  
  return alerts;
};
