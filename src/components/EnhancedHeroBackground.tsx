
import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import GeometricPattern from './patterns/GeometricPattern';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const EnhancedHeroBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.min(75, Math.floor(window.innerWidth / 20));
      
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.15 + 0.05
        });
      }
    };
    initParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        // Move particle down
        particle.y += particle.speed;
        
        // Reset particle when it goes off screen
        if (particle.y > canvas.height + 10) {
          particle.y = -10;
          particle.x = Math.random() * canvas.width;
        }

        // Draw particle with theme-aware color
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'dark' 
          ? `rgba(255, 255, 255, ${particle.opacity})`
          : `rgba(0, 0, 0, ${particle.opacity * 0.6})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <>
      {/* Multi-stop radial gradient background */}
      <div 
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: isDark ? `
            radial-gradient(ellipse 120% 80% at 50% 90%, 
              rgba(15, 23, 42, 0.95) 0%,
              rgba(30, 41, 59, 0.9) 25%,
              rgba(51, 65, 85, 0.8) 50%,
              rgba(15, 23, 42, 0.95) 100%
            ),
            radial-gradient(ellipse 80% 60% at 30% 70%, 
              rgba(20, 184, 166, 0.03) 0%,
              transparent 70%
            ),
            radial-gradient(ellipse 60% 40% at 70% 80%, 
              rgba(34, 197, 94, 0.02) 0%,
              transparent 70%
            )
          ` : `
            radial-gradient(ellipse 120% 80% at 50% 90%, 
              rgba(248, 250, 252, 0.95) 0%,
              rgba(241, 245, 249, 0.9) 25%,
              rgba(226, 232, 240, 0.8) 50%,
              rgba(248, 250, 252, 0.95) 100%
            ),
            radial-gradient(ellipse 80% 60% at 30% 70%, 
              rgba(20, 184, 166, 0.08) 0%,
              transparent 70%
            ),
            radial-gradient(ellipse 60% 40% at 70% 80%, 
              rgba(34, 197, 94, 0.06) 0%,
              transparent 70%
            )
          `,
          zIndex: 1
        }}
      />

      {/* Circle Pattern Layer */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='0' cy='0' r='50' fill='none' stroke='%23C4C6C8' stroke-width='2'/%3E%3Ccircle cx='100' cy='0' r='50' fill='none' stroke='%23C4C6C8' stroke-width='2'/%3E%3Ccircle cx='0' cy='100' r='50' fill='none' stroke='%23C4C6C8' stroke-width='2'/%3E%3Ccircle cx='100' cy='100' r='50' fill='none' stroke='%23C4C6C8' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='50' fill='none' stroke='%23C4C6C8' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundSize: 'clamp(80px, 7vw, 140px)',
          backgroundRepeat: 'repeat',
          backgroundPosition: '0 0'
        }}
      />
      
      {/* Reduced noise texture overlay - less interference */}
      <div 
        className="absolute inset-0 opacity-[0.01] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
          zIndex: 3
        }}
      />

      {/* Particle canvas - lower z-index so pattern shows above */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 15 }}
      />

      {/* Button glow effect */}
      <div 
        className="absolute inset-0 animate-button-glow"
        style={{
          background: isDark ? `
            radial-gradient(ellipse 40% 20% at 50% 65%, 
              rgba(20, 184, 166, 0.08) 0%,
              rgba(20, 184, 166, 0.04) 30%,
              transparent 70%
            )
          ` : `
            radial-gradient(ellipse 40% 20% at 50% 65%, 
              rgba(20, 184, 166, 0.12) 0%,
              rgba(20, 184, 166, 0.06) 30%,
              transparent 70%
            )
          `,
          zIndex: 5
        }}
      />
    </>
  );
};

export default EnhancedHeroBackground;
