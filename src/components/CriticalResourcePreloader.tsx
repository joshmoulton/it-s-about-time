import { useEffect } from 'react';

export const CriticalResourcePreloader = () => {
  useEffect(() => {
    // Preload critical fonts immediately
    const criticalFonts = [
      'Inter',
      'Merriweather', 
      'Montserrat'
    ];

    criticalFonts.forEach(font => {
      if ('fonts' in document) {
        document.fonts.load(`400 16px ${font}`).catch(() => {
          // Fail silently for better UX
        });
      }
    });

    // Preload critical images
    const criticalImages = [
      '/lovable-uploads/97f86327-e463-4091-8474-4f835ee7556f.png',
      '/lovable-uploads/a8eaa39b-22e5-4a3c-a288-fe43b8619eab.png'
    ];

    criticalImages.forEach(src => {
      const img = new Image();
      img.src = src;
      img.loading = 'eager';
      img.fetchPriority = 'high';
    });

    // Prefetch next likely resources
    const prefetchResources = [
      '/lovable-uploads/2766797d-f12e-40af-bcc7-5fdee4ce7325.png'
    ];

    prefetchResources.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'image';
      document.head.appendChild(link);
    });
  }, []);

  return null;
};