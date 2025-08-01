import React from 'react';
import { Lock, Crown } from 'lucide-react';

interface FreemiumBlurOverlayProps {
  onUpgradeClick: () => void;
  blurIntensity?: 'light' | 'medium' | 'heavy';
  showIcon?: boolean;
  message?: string;
}

export function FreemiumBlurOverlay({ 
  onUpgradeClick, 
  blurIntensity = 'light',
  showIcon = true,
  message = "Upgrade to Premium"
}: FreemiumBlurOverlayProps) {
  const blurClasses = {
    light: 'backdrop-blur-[2px]',
    medium: 'backdrop-blur-sm',
    heavy: 'backdrop-blur-md'
  };

  return (
    <div 
      className={`absolute inset-0 z-10 ${blurClasses[blurIntensity]} bg-slate-900/30 rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-900/40 group flex items-center justify-center`}
      onClick={onUpgradeClick}
    >
      {showIcon && (
        <div className="bg-slate-800/90 border border-slate-600/50 rounded-lg px-4 py-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-medium text-sm">{message}</span>
          <Lock className="w-4 h-4 text-slate-400" />
        </div>
      )}
    </div>
  );
}