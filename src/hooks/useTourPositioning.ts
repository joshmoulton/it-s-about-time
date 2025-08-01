
import { useState, useEffect, useCallback } from 'react';

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
  placement: TourPlacement;
}

interface TourPositioningOptions {
  targetElement: Element | null;
  preferredPlacement: TourPlacement;
  offset: number;
}

export function useTourPositioning({ 
  targetElement, 
  preferredPlacement, 
  offset = 12 
}: TourPositioningOptions) {
  const [position, setPosition] = useState<Position>({ 
    x: 0, 
    y: 0, 
    placement: preferredPlacement 
  });

  const calculatePosition = useCallback(() => {
    if (!targetElement) return;

    const targetRect = targetElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= 768;
    const isTablet = viewportWidth <= 1024 && viewportWidth > 768;
    
    // Responsive tooltip dimensions - more conservative sizing
    const tooltipWidth = isMobile 
      ? Math.min(360, viewportWidth - 24) 
      : isTablet 
        ? 380 
        : 420;
    const tooltipHeight = isMobile ? 280 : 260; // Reduced height
    const safeMargin = isMobile ? 12 : 16; // Reduced margins
    const minOffset = isMobile ? 16 : 24; // Reduced offset
    const bottomBuffer = isMobile ? 80 : 120; // Much smaller buffer

    let finalPlacement = preferredPlacement;
    let x = 0;
    let y = 0;

    // Try preferred placement first
    const tryPlacement = (placement: TourPlacement) => {
      switch (placement) {
        case 'top':
          x = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
          y = targetRect.top - tooltipHeight - minOffset;
          return y >= safeMargin;

        case 'bottom':
          x = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
          y = targetRect.bottom + minOffset;
          // Allow more flexible bottom positioning
          const maxBottomY = isMobile ? viewportHeight * 0.6 : viewportHeight * 0.7;
          return y + tooltipHeight <= viewportHeight - safeMargin - bottomBuffer && y < maxBottomY;

        case 'left':
          x = targetRect.left - tooltipWidth - minOffset;
          y = Math.min(
            targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
            isMobile ? viewportHeight * 0.3 : viewportHeight * 0.4 // Better mobile positioning
          );
          return x >= safeMargin && !isMobile; // Avoid left/right on mobile

        case 'right':
          x = targetRect.right + minOffset;
          y = Math.min(
            targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
            isMobile ? viewportHeight * 0.3 : viewportHeight * 0.4 // Better mobile positioning
          );
          return x + tooltipWidth <= viewportWidth - safeMargin && !isMobile; // Avoid left/right on mobile
      }
      return false;
    };

    // Try preferred placement first
    if (!tryPlacement(preferredPlacement)) {
      // Mobile-first alternatives - prioritize top and bottom
      const alternatives: TourPlacement[] = isMobile 
        ? ['top', 'bottom'] 
        : ['top', 'left', 'right', 'bottom'];
      let placementFound = false;
      
      for (const altPlacement of alternatives) {
        if (altPlacement !== preferredPlacement && tryPlacement(altPlacement)) {
          finalPlacement = altPlacement;
          placementFound = true;
          break;
        }
      }
      
      // If no placement works, force optimal placement based on screen size
      if (!placementFound) {
        finalPlacement = isMobile ? 'bottom' : 'top';
        x = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        y = isMobile 
          ? Math.min(targetRect.bottom + minOffset, viewportHeight * 0.4)
          : Math.max(safeMargin, targetRect.top - tooltipHeight - minOffset);
      }
    }

    // Final viewport boundary adjustments
    if (x < safeMargin) x = safeMargin;
    if (x + tooltipWidth > viewportWidth - safeMargin) {
      x = viewportWidth - tooltipWidth - safeMargin;
    }

    // Ensure tooltip stays within reasonable bounds
    const maxY = isMobile ? viewportHeight * 0.8 : viewportHeight * 0.85; // Much more flexible
    if (y < safeMargin) y = safeMargin;
    if (y + tooltipHeight > maxY) y = maxY - tooltipHeight;

    setPosition({ x, y, placement: finalPlacement });
  }, [targetElement, preferredPlacement, offset]);

  useEffect(() => {
    calculatePosition();

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [calculatePosition]);

  return position;
}
