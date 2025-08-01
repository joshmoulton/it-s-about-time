import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
}

const ParticleConstellation = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [connections, setConnections] = useState<Array<{x1: number, y1: number, x2: number, y2: number, opacity: number}>>([]);

  useEffect(() => {
    // Generate initial particles
    const initialParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      opacity: 0.3 + Math.random() * 0.4,
    }));

    setParticles(initialParticles);

    // Animation loop
    const animate = () => {
      setParticles(prevParticles => {
        const newParticles = prevParticles.map(particle => ({
          ...particle,
          x: (particle.x + particle.vx + 100) % 100,
          y: (particle.y + particle.vy + 100) % 100,
        }));

        // Calculate connections
        const newConnections: Array<{x1: number, y1: number, x2: number, y2: number, opacity: number}> = [];
        
        for (let i = 0; i < newParticles.length; i++) {
          for (let j = i + 1; j < newParticles.length; j++) {
            const p1 = newParticles[i];
            const p2 = newParticles[j];
            const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
            
            if (distance < 25) { // Connection threshold
              const opacity = Math.max(0, 0.15 - (distance / 25) * 0.15);
              newConnections.push({
                x1: p1.x,
                y1: p1.y,
                x2: p2.x,
                y2: p2.y,
                opacity,
              });
            }
          }
        }

        setConnections(newConnections);
        return newParticles;
      });
    };

    const interval = setInterval(animate, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      <div className="absolute inset-0 opacity-60">
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full">
          {connections.map((connection, index) => (
            <line
              key={index}
              x1={`${connection.x1}%`}
              y1={`${connection.y1}%`}
              x2={`${connection.x2}%`}
              y2={`${connection.y2}%`}
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              opacity={connection.opacity}
              className="transition-opacity duration-500"
            />
          ))}
        </svg>

        {/* Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-primary rounded-full transition-all duration-500 ease-out"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 8px hsl(var(--primary) / 0.5)',
            }}
          />
        ))}

        {/* Larger accent particles */}
        {particles.slice(0, 3).map((particle) => (
          <div
            key={`accent-${particle.id}`}
            className="absolute w-1 h-1 bg-accent rounded-full transition-all duration-700 ease-out"
            style={{
              left: `${(particle.x + 10) % 100}%`,
              top: `${(particle.y + 15) % 100}%`,
              opacity: particle.opacity * 0.6,
              transform: 'translate(-50%, -50%)',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ParticleConstellation;