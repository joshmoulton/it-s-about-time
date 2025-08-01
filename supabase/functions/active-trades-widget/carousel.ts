
import { TradeAlert } from './types.ts';

export const generateCarouselSlides = (tradeAlerts: TradeAlert[]): string => {
  return Array.from({ length: Math.ceil(tradeAlerts.length / 2) }, (_, slideIndex) => `
    <div class="carousel-slide">
        ${tradeAlerts.slice(slideIndex * 2, slideIndex * 2 + 2).map(trade => `
            <div class="trade-card">
                <div class="trade-header">
                    <div>
                        <div class="trade-symbol">${trade.symbol}</div>
                        <div class="trade-badges">
                            <span class="badge badge-trader">${trade.trader}</span>
                            <span class="badge badge-active">Active</span>
                        </div>
                    </div>
                    <div class="trade-profit">
                        <div class="profit-amount ${trade.profit_loss >= 0 ? 'positive' : 'negative'}">
                            ${trade.profit_loss >= 0 ? '+' : ''}$${Math.abs(trade.profit_loss).toFixed(2)}
                        </div>
                        <div class="profit-percentage ${trade.profit_percentage >= 0 ? 'positive' : 'negative'}">
                            ${trade.profit_percentage >= 0 ? '+' : ''}${trade.profit_percentage.toFixed(1)}%
                        </div>
                    </div>
                </div>
                
                <div class="trade-details">
                    <div class="detail-item">
                        <span class="detail-label">Entry:</span>
                        <span class="detail-value">$${trade.entry_price.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Current:</span>
                        <span class="detail-value">$${trade.current_price.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${trade.trade_type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">Trading</span>
                    </div>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill ${trade.profit_percentage >= 0 ? 'positive' : 'negative'}" 
                         style="width: ${Math.min(Math.abs(trade.profit_percentage), 100)}%"></div>
                </div>
            </div>
        `).join('')}
    </div>
  `).join('');
};

export const generateCarouselNavigation = (totalSlides: number): string => {
  return `
    <div class="carousel-nav">
        <button class="nav-button" id="prevBtn">← Prev</button>
        <div class="carousel-dots" id="carouselDots">
            ${Array.from({ length: totalSlides }, (_, i) => `
                <div class="dot ${i === 0 ? 'active' : ''}" data-slide="${i}"></div>
            `).join('')}
        </div>
        <button class="nav-button" id="nextBtn">Next →</button>
    </div>
  `;
};
