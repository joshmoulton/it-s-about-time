import React, { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

interface YouTubeLiteProps {
  videoId: string;
  title: string;
  className?: string;
  thumbnailQuality?: 'default' | 'medium' | 'high' | 'standard' | 'maxres';
  autoplay?: boolean;
}

export const YouTubeLite: React.FC<YouTubeLiteProps> = ({
  videoId,
  title,
  className = '',
  thumbnailQuality = 'maxres',
  autoplay = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handlePlay = () => {
    setIsLoaded(true);
  };

  const thumbnailSrc = `https://i.ytimg.com/vi/${videoId}/${thumbnailQuality}default.jpg`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  if (isLoaded) {
    return (
      <div ref={containerRef} className={`relative w-full pb-[56.25%] h-0 overflow-hidden ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full pb-[56.25%] h-0 overflow-hidden cursor-pointer group ${className}`}
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && handlePlay()}
      aria-label={`Play video: ${title}`}
    >
      {isIntersecting && (
        <img
          src={thumbnailSrc}
          alt={title}
          className="absolute top-0 left-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )}
      
      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-2xl">
          <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="currentColor" />
        </div>
      </div>
      
      {/* Title Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4">
        <h3 className="text-white font-medium text-sm md:text-base line-clamp-2">{title}</h3>
      </div>
      
      {/* Loading placeholder if not in view */}
      {!isIntersecting && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
};