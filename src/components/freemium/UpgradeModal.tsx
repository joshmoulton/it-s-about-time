import React from 'react';
import PremiumPricingModal from '@/components/PremiumPricingModal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function UpgradeModal({ isOpen, onClose, featureName = "this feature" }: UpgradeModalProps) {
  return (
    <PremiumPricingModal 
      open={isOpen} 
      onOpenChange={onClose}
    />
  );
}