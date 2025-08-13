import React from 'react';
import { PricingModal } from '@/components/pricing/PricingModal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function UpgradeModal({ isOpen, onClose, featureName = "this feature" }: UpgradeModalProps) {
  return (
    <PricingModal 
      open={isOpen} 
      onOpenChange={onClose}
    />
  );
}