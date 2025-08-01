
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SubtleGeometricOverlayProps {
  className?: string;
  opacity?: number;
}

const SubtleGeometricOverlay: React.FC<SubtleGeometricOverlayProps> = ({ 
  className = '',
  opacity = 0.28 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Improved subtle version for section backgrounds
  const strokeColor = isDark 
    ? `rgba(139, 199, 255, ${opacity * 2})` // Lighter blue for dark mode
    : `rgba(51, 85, 255, ${opacity})`;

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='subtle-circles' x='0' y='0' width='200' height='200' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='1'/%3E%3Ccircle cx='150' cy='50' r='30' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='1'/%3E%3Ccircle cx='100' cy='120' r='30' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='1'/%3E%3Ccircle cx='40' cy='160' r='20' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='1'/%3E%3Ccircle cx='160' cy='160' r='20' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23subtle-circles)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
        mixBlendMode: 'multiply', // Changed from overlay to multiply for better visibility
        zIndex: 1
      }}
    />
  );
};

export default SubtleGeometricOverlay;
