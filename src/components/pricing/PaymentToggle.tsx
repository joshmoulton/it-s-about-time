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
      <div className="bg-muted p-1 rounded-lg flex">
        <button 
          onClick={() => onPaymentMethodChange('card')} 
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            paymentMethod === 'card' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="h-4 w-4 inline mr-2" />
          Credit Card
        </button>
        <button 
          onClick={() => onPaymentMethodChange('crypto')} 
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            paymentMethod === 'crypto' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bitcoin className="h-4 w-4 inline mr-2" />
          Crypto
        </button>
      </div>
    </div>
  );
};