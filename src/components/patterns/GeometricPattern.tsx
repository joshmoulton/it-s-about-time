
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface GeometricPatternProps {
  opacity?: number;
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
  debug?: boolean;
}

const GeometricPattern: React.FC<GeometricPatternProps> = ({ 
  opacity = 0.05, 
  size = 'medium',
  animate = false,
  debug = false 
}) => {
  const { theme } = useTheme();
  
  const getSizeValues = () => {
    switch (size) {
      case 'small': return { patternSize: 60, circleRadius: 20 };
      case 'large': return { patternSize: 100, circleRadius: 35 };
      default: return { patternSize: 80, circleRadius: 28 };
    }
  };

  const { patternSize, circleRadius } = getSizeValues();
  const isDark = theme === 'dark';
  
  // Extremely subtle colors for minimal interference
  const strokeColor = isDark 
    ? `rgba(255, 255, 255, ${debug ? 1 : opacity * 0.3})` // Extremely subtle white for dark mode
    : `rgba(0, 0, 0, ${debug ? 0.8 : opacity * 0.2})`; // Extremely subtle dark for light mode

  const strokeWidth = debug ? 3 : 1; // Much thinner strokes for subtlety
  
  // Create the perfect overlapping circle pattern matching the reference image
  // Mathematical positioning for exact quatrefoil overlap shapes
  const half = patternSize / 2;
  const quarter = patternSize / 4;
  
  const createOverlapPattern = () => {
    return `
      <pattern id='circle-overlap' x='0' y='0' width='${patternSize}' height='${patternSize}' patternUnits='userSpaceOnUse'>
        <!-- Four corner circles that create the overlapping quatrefoil pattern -->
        <circle cx='${quarter}' cy='${quarter}' r='${circleRadius}' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='${strokeWidth}'/>
        <circle cx='${patternSize - quarter}' cy='${quarter}' r='${circleRadius}' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='${strokeWidth}'/>
        <circle cx='${quarter}' cy='${patternSize - quarter}' r='${circleRadius}' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='${strokeWidth}'/>
        <circle cx='${patternSize - quarter}' cy='${patternSize - quarter}' r='${circleRadius}' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='${strokeWidth}'/>
        
        <!-- Edge circles for seamless tiling -->
        <circle cx='0' cy='${half}' r='${circleRadius}' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='${strokeWidth}'/>
        <circle cx='${patternSize}' cy='${half}' r='${circleRadius}' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='${strokeWidth}'/>
        <circle cx='${half}' cy='0' r='${circleRadius}' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='${strokeWidth}'/>
        <circle cx='${half}' cy='${patternSize}' r='${circleRadius}' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='${strokeWidth}'/>
        
        <!-- Center circle for complete overlap effect -->
        <circle cx='${half}' cy='${half}' r='${circleRadius}' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='${strokeWidth}'/>
      </pattern>
    `;
  };

  const svgDataUrl = `data:image/svg+xml,%3Csvg width='${patternSize}' height='${patternSize}' viewBox='0 0 ${patternSize} ${patternSize}' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E${encodeURIComponent(createOverlapPattern())}%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23circle-overlap)'/%3E%3C/svg%3E`;

  if (debug) {
    console.log('GeometricPattern Debug:', {
      theme,
      strokeColor,
      opacity,
      patternSize,
      circleRadius,
      svgDataUrl: svgDataUrl.substring(0, 100) + '...'
    });
  }

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${animate ? 'animate-drift-slow' : ''}`}
      style={{ 
        backgroundImage: `url("${svgDataUrl}")`,
        backgroundSize: `${patternSize}px ${patternSize}px`,
        mixBlendMode: 'normal', // Normal blend mode for maximum visibility
        zIndex: 10, // Higher z-index to ensure visibility above other layers
        opacity: 1 // Full opacity, let the stroke color handle transparency
      }}
    />
  );
};

export default GeometricPattern;
