import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CyclingTextProps {
  words: string[];
  className?: string;
  interval?: number;
}

const CyclingText = ({ words, className, interval = 2000 }: CyclingTextProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile and disable animations on mobile for performance
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsRolling(true);
      
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setIsRolling(false);
      }, isMobile ? 150 : 250); // Faster transition on mobile
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval, isMobile]);

  return (
    <span 
      className={cn(
        "inline-block whitespace-nowrap w-full text-left",
        "transition-all duration-300 ease-in-out will-change-transform",
        isRolling && !isMobile ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0",
        className
      )}
      style={{ 
        minWidth: '120px',
        textAlign: 'left'
      }}
    >
      {words[currentWordIndex]}
    </span>
  );
};

export default CyclingText;