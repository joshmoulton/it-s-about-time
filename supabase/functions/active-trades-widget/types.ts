
export interface TradeAlert {
  id: string;
  symbol: string;
  trader: string;
  entry_price: number;
  current_price: number;
  profit_loss: number;
  profit_percentage: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  entry_activated?: boolean;
}
