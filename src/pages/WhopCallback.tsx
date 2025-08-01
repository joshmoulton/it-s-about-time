
import React from 'react';
import { useWhopCallback } from '@/hooks/useWhopCallback';
import { WhopCallbackLoading } from '@/components/auth/whop/WhopCallbackLoading';
import { WhopCallbackError } from '@/components/auth/whop/WhopCallbackError';

const WhopCallback = () => {
  console.log('🔄 WhopCallback page mounted');
  console.log('Current URL:', window.location.href);
  console.log('URL params:', new URLSearchParams(window.location.search).toString());
  
  const { isProcessing, error, status } = useWhopCallback();

  console.log('WhopCallback state:', { isProcessing, error, status });

  if (isProcessing) {
    return <WhopCallbackLoading status={status} />;
  }

  if (error) {
    return <WhopCallbackError error={error} />;
  }

  // This shouldn't normally be reached, but just in case
  return <WhopCallbackLoading status="Completing authentication..." />;
};

export default WhopCallback;
