import React, { useEffect } from 'react';
import { WhopCheckoutEmbed } from '@whop/react/checkout';

interface WhopPreloaderProps {
  isVisible: boolean;
  productIds: string[];
}

export const WhopPreloader: React.FC<WhopPreloaderProps> = ({ isVisible, productIds }) => {
  // Avoid rendering the embed in iframe environments (e.g., Lovable preview)
  const isInIframe = typeof window !== 'undefined' && window.top !== window.self;

  useEffect(() => {
    if (isVisible && productIds.length > 0 && !isInIframe) {
      console.log('Warming up Whop checkout components...');
    }
  }, [isVisible, productIds, isInIframe]);

  if (!isVisible || productIds.length === 0 || isInIframe) {
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