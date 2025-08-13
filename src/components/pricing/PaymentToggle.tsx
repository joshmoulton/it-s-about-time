import React from 'react';
import { CreditCard, Bitcoin } from 'lucide-react';

interface PaymentToggleProps {
  paymentMethod: 'card' | 'crypto';
  onPaymentMethodChange: (method: 'card' | 'crypto') => void;
}

export const PaymentToggle: React.FC<PaymentToggleProps> = ({ 
  paymentMethod, 
  onPaymentMethodChange 
}) => {
  return (
    <div className="flex justify-center">
      <div className="bg-muted p-1 rounded-lg flex w-full max-w-xs sm:w-auto">
        <button 
          onClick={() => onPaymentMethodChange('card')} 
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-1 sm:gap-2 touch-manipulation ${
            paymentMethod === 'card' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline sm:inline">Credit Card</span>
          <span className="xs:hidden sm:hidden">Card</span>
        </button>
        <button 
          onClick={() => onPaymentMethodChange('crypto')} 
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-1 sm:gap-2 touch-manipulation ${
            paymentMethod === 'crypto' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bitcoin className="h-3 w-3 sm:h-4 sm:w-4" />
          Crypto
        </button>
      </div>
    </div>
  );
};