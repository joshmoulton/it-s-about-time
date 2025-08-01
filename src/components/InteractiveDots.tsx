
import React, { useEffect, useRef, useState } from 'react';

interface Dot {
  id: number;
  originalX: number;
  originalY: number;
  currentX: number;
  currentY: number;
}

interface InteractiveDotsProps {
  className?: string;
}

const InteractiveDots: React.FC<InteractiveDotsProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = useState<Dot[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Initialize dots grid
  useEffect(() => {
    const initializeDots = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const spacing = 50;
      const newDots: Dot[] = [];
      let id = 0;

      for (let x = spacing; x < rect.width; x += spacing) {
        for (let y = spacing; y < rect.height; y += spacing) {
          newDots.push({
            id: id++,
            originalX: x,
            originalY: y,
            currentX: x,
            currentY: y,
          });
        }
      }

      setDots(newDots);
    };

    initializeDots();
    window.addEventListener('resize', initializeDots);
    return () => window.removeEventListener('resize', initializeDots);
  }, []);

  // Handle mouse movement
  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const throttledMouseMove = (e: MouseEvent) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        handleMouseMove(e);
      });
    };

    document.addEventListener('mousemove', throttledMouseMove);
    return () => {
      document.removeEventListener('mousemove', throttledMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [prefersReducedMotion]);

  // Animate dots based on cursor position
  useEffect(() => {
    if (prefersReducedMotion) return;

    const animateDots = () => {
      setDots(prevDots => 
        prevDots.map(dot => {
          const dx = mousePos.x - dot.originalX;
          const dy = mousePos.y - dot.originalY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 100; // Influence radius
          
          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            const angle = Math.atan2(dy, dx);
            const pushDistance = force * 15; // Maximum push distance
            
            return {
              ...dot,
              currentX: dot.originalX - Math.cos(angle) * pushDistance,
              currentY: dot.originalY - Math.sin(angle) * pushDistance,
            };
          } else {
            // Return to original position with easing
            return {
              ...dot,
              currentX: dot.currentX + (dot.originalX - dot.currentX) * 0.1,
              currentY: dot.currentY + (dot.originalY - dot.currentY) * 0.1,
            };
          }
        })
      );
    };

    const animate = () => {
      animateDots();
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [mousePos, prefersReducedMotion]);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ overflow: 'hidden' }}
    >
      {dots.map(dot => (
        <div
          key={dot.id}
          className="absolute w-0.5 h-0.5 bg-primary rounded-full opacity-20"
          style={{
            transform: `translate3d(${dot.currentX}px, ${dot.currentY}px, 0)`,
            transition: prefersReducedMotion ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      ))}
    </div>
  );
};

export default InteractiveDots;
