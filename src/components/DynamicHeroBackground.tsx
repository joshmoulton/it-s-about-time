
import { useEffect, useRef, useState } from 'react';
import { useTheme } from "@/contexts/ThemeContext";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const DynamicHeroBackground = () => {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const lastFrameTime = useRef<number>(0);

  // Handle mounting and detect mobile
  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mounted) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with pixel ratio for sharp rendering
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles with mobile optimization
    const initParticles = () => {
      particlesRef.current = [];
      // Drastically reduce particles on mobile for performance
      const particleCount = isMobile ? 15 : Math.min(40, Math.floor(window.innerWidth / 30));
      
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * (canvas.width / (window.devicePixelRatio || 1)),
          y: Math.random() * (canvas.height / (window.devicePixelRatio || 1)),
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.3 + 0.1,
          opacity: Math.random() * 0.06 + 0.02
        });
      }
    };
    initParticles();

    // Throttled animation loop for better performance
    const animate = (currentTime: number) => {
      // Limit to 30fps on mobile, 60fps on desktop
      const targetFPS = isMobile ? 30 : 60;
      const interval = 1000 / targetFPS;
      
      if (currentTime - lastFrameTime.current < interval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime.current = currentTime;
      
      const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
      const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
      
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        // Move particle down
        particle.y += particle.speed;
        
        // Reset particle when it goes off screen
        if (particle.y > canvasHeight + 10) {
          particle.y = -10;
          particle.x = Math.random() * canvasWidth;
        }

        // Draw particle with theme-appropriate color
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'light' 
          ? `rgba(0, 0, 0, ${particle.opacity * 0.3})`
          : `rgba(255, 255, 255, ${particle.opacity * 0.5})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Only start animation if not on a low-end device
    if (!('connection' in navigator) || (navigator.connection as any)?.effectiveType !== 'slow-2g') {
      animate(0);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mounted, isMobile, theme]);

  return (
    <>
      {/* Theme-aware background fill */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Circle pattern overlay - consistent across all devices */}
      <div 
        className="absolute inset-0 opacity-20 z-[5]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='0' cy='0' r='50' fill='none' stroke='%23C4C6C8' stroke-width='2'/%3E%3Ccircle cx='100' cy='0' r='50' fill='none' stroke='%23C4C6C8' stroke-width='2'/%3E%3Ccircle cx='0' cy='100' r='50' fill='none' stroke='%23C4C6C8' stroke-width='2'/%3E%3Ccircle cx='100' cy='100' r='50' fill='none' stroke='%23C4C6C8' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%23C4C6C8' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundSize: 'clamp(80px, 7vw, 140px)',
          backgroundRepeat: 'repeat',
          backgroundPosition: '0 0'
        }}
      />
      
      {/* Subtle glow from features section - show on all devices */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-24 z-[5]"
        style={{
          background: 'linear-gradient(to top, rgba(24, 33, 82, 0.4) 0%, transparent 100%)'
        }}
      />

      {/* Particle canvas - disabled on mobile for performance */}
      {mounted && !isMobile && window.innerWidth > 768 && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none will-change-auto z-[6]"
        />
      )}
    </>
  );
};

export default DynamicHeroBackground;
