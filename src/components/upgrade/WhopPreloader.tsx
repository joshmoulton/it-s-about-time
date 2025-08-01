import React, { useEffect } from 'react';
import { WhopCheckoutEmbed } from '@whop/react/checkout';

interface WhopPreloaderProps {
  isVisible: boolean;
  productIds: string[];
}

export const WhopPreloader: React.FC<WhopPreloaderProps> = ({ isVisible, productIds }) => {
  useEffect(() => {
    if (isVisible && productIds.length > 0) {
      // Warm up the Whop React component by rendering it hidden
      console.log('Warming up Whop checkout components...');
    }
  }, [isVisible, productIds]);

  if (!isVisible || productIds.length === 0) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
        visibility: 'hidden'
      }}
      aria-hidden="true"
    >
      {/* Render the first product ID to warm up the component */}
      <WhopCheckoutEmbed
        planId={productIds[0]}
        theme="light"
        fallback={<div>Loading...</div>}
      />
    </div>
  );
};