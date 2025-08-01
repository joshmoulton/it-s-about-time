
import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Panel {
  id: string;
  content: React.ReactNode;
}

interface HorizontalScrollSectionProps {
  panels: Panel[];
  showNavigation?: boolean;
  className?: string;
  panelClassName?: string;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  pauseOnHover?: boolean;
}

const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({
  panels,
  showNavigation = true,
  className,
  panelClassName,
  autoScroll = false,
  autoScrollInterval = 4000,
  pauseOnHover = true
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);

    // Update current panel index based on scroll position
    const newIndex = Math.round(scrollLeft / clientWidth);
    setCurrentPanelIndex(newIndex);
  };

  const scrollToPanel = (direction: 'left' | 'right' | number) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const panelWidth = container.clientWidth;
    
    let targetIndex: number;
    
    if (typeof direction === 'number') {
      targetIndex = direction;
    } else {
      targetIndex = direction === 'left' 
        ? Math.max(0, currentPanelIndex - 1)
        : Math.min(panels.length - 1, currentPanelIndex + 1);
    }
    
    container.scrollTo({
      left: targetIndex * panelWidth,
      behavior: 'smooth'
    });

    // Reset auto-scroll timer when manually navigating
    if (autoScroll) {
      resetAutoScrollTimer();
    }
  };

  const scrollToNextPanel = () => {
    const nextIndex = (currentPanelIndex + 1) % panels.length;
    scrollToPanel(nextIndex);
  };

  const resetAutoScrollTimer = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
    
    if (autoScroll && (!pauseOnHover || !isHovered)) {
      autoScrollRef.current = setInterval(() => {
        scrollToNextPanel();
      }, autoScrollInterval);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [panels]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll) {
      resetAutoScrollTimer();
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [autoScroll, autoScrollInterval, isHovered, pauseOnHover]);

  // Handle hover state for auto-scroll pause
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (autoScroll && pauseOnHover && autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (autoScroll && pauseOnHover) {
      resetAutoScrollTimer();
    }
  };

  return (
    <div 
      className={cn("relative group", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation Arrows */}
      {showNavigation && (
        <>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full",
              "bg-background/95 backdrop-blur-sm border-border/50",
              "shadow-lg hover:shadow-xl transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              !canScrollLeft && "opacity-0 cursor-not-allowed"
            )}
            onClick={() => scrollToPanel('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full",
              "bg-background/95 backdrop-blur-sm border-border/50",
              "shadow-lg hover:shadow-xl transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              !canScrollRight && "opacity-0 cursor-not-allowed"
            )}
            onClick={() => scrollToPanel('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex overflow-x-auto overflow-y-hidden",
          "scrollbar-hide scroll-smooth",
          "snap-x snap-mandatory",
          "-webkit-overflow-scrolling-touch"
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {panels.map((panel, index) => (
          <div
            key={panel.id}
            className={cn(
              "flex-none w-full snap-start",
              "p-6 md:p-8",
              "bg-card border-r border-border last:border-r-0",
              "min-h-[300px] md:min-h-[400px]",
              panelClassName
            )}
            style={{ minWidth: '100%' }}
          >
            {panel.content}
          </div>
        ))}
      </div>

      {/* Scroll Indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {panels.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-200",
              index === currentPanelIndex 
                ? "bg-primary" 
                : "bg-muted hover:bg-muted-foreground/50"
            )}
            onClick={() => scrollToPanel(index)}
            aria-label={`Go to panel ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HorizontalScrollSection;
