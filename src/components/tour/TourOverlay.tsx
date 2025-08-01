
import React, { useState, useEffect } from 'react';

interface TourOverlayProps {
  targetElement: Element | null;
  onClose: () => void;
  isScrolling?: boolean;
}

export function TourOverlay({ targetElement, onClose, isScrolling = false }: TourOverlayProps) {
  const [overlayPositions, setOverlayPositions] = useState<any>(null);

  const calculateOverlayPositions = () => {
    if (!targetElement) return null;

    // Check if there are multiple elements to highlight
    const elementsToHighlight = (targetElement as any)._tourMultiElements || [targetElement];
    
    // Calculate bounding box that encompasses all elements
    let minTop = Infinity, minLeft = Infinity, maxBottom = -Infinity, maxRight = -Infinity;
    
    elementsToHighlight.forEach((element: Element) => {
      const rect = element.getBoundingClientRect();
      minTop = Math.min(minTop, rect.top);
      minLeft = Math.min(minLeft, rect.left);
      maxBottom = Math.max(maxBottom, rect.bottom);
      maxRight = Math.max(maxRight, rect.right);
    });

    const highlightPadding = 8;
    const combinedWidth = maxRight - minLeft;
    const combinedHeight = maxBottom - minTop;

    // Get document-relative positions for the combined area
    const documentTop = minTop + window.scrollY;
    const documentLeft = minLeft + window.scrollX;

    return {
      topOverlay: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        height: documentTop - highlightPadding,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        pointerEvents: 'auto' as const,
      },
      bottomOverlay: {
        position: 'absolute' as const,
        top: documentTop + combinedHeight + highlightPadding,
        left: 0,
        right: 0,
        height: Math.max(document.documentElement.scrollHeight, window.innerHeight) - (documentTop + combinedHeight + highlightPadding),
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        pointerEvents: 'auto' as const,
      },
      leftOverlay: {
        position: 'absolute' as const,
        top: documentTop - highlightPadding,
        left: 0,
        width: documentLeft - highlightPadding,
        height: combinedHeight + highlightPadding * 2,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        pointerEvents: 'auto' as const,
      },
      rightOverlay: {
        position: 'absolute' as const,
        top: documentTop - highlightPadding,
        left: documentLeft + combinedWidth + highlightPadding,
        right: 0,
        height: combinedHeight + highlightPadding * 2,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        pointerEvents: 'auto' as const,
      },
      spotlightBorder: {
        position: 'absolute' as const,
        top: documentTop - highlightPadding,
        left: documentLeft - highlightPadding,
        width: combinedWidth + highlightPadding * 2,
        height: combinedHeight + highlightPadding * 2,
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
        // animation: 'tourPulse 2s ease-in-out infinite', // Removed bouncing animation
        pointerEvents: 'none' as const,
        zIndex: 9999,
      }
    };
  };

  // Enhanced animation for spotlight border - moved to top to fix hooks order
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tourPulse {
        0%, 100% {
          transform: scale(1);
          border-color: #3b82f6;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }
        50% {
          transform: scale(1.005);
          border-color: #60a5fa;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const updatePositions = () => {
      setOverlayPositions(calculateOverlayPositions());
    };

    updatePositions();
    
    const handleScroll = () => updatePositions();
    const handleResize = () => updatePositions();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [targetElement]);

  if (!targetElement || !overlayPositions) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: Math.max(document.documentElement.scrollHeight, window.innerHeight),
      zIndex: 9997,
      pointerEvents: 'none'
    }}>
      {/* Four separate overlay sections to create the spotlight effect */}
      <div style={overlayPositions.topOverlay} onClick={onClose} />
      <div style={overlayPositions.bottomOverlay} onClick={onClose} />
      <div style={overlayPositions.leftOverlay} onClick={onClose} />
      <div style={overlayPositions.rightOverlay} onClick={onClose} />
      
      {/* Spotlight border removed */}
    </div>
  );
}
