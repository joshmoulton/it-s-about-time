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

    // Add connection/resource hints instead of eager image loads
    try {
      const supabaseOrigin = 'https://wrvvlmevpvcenauglcyz.supabase.co';
      const addLink = (rel: string, href: string, as?: string, crossOrigin?: string) => {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        if (as) link.as = as;
        if (crossOrigin) link.crossOrigin = crossOrigin;
        document.head.appendChild(link);
      };
      // Preconnect to Supabase for faster API/image fetches
      addLink('preconnect', supabaseOrigin, undefined, 'anonymous');
      addLink('dns-prefetch', supabaseOrigin);

      // Only prefetch critical images that are above the fold
      const idlePrefetch = () => {
        // Removed large image prefetches to improve mobile performance
        // Only prefetch truly critical resources
        const criticalResources = [
          // Keep this minimal for mobile performance
        ];
        criticalResources.forEach(href => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = href;
          link.as = 'image';
          document.head.appendChild(link);
        });
      };
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(idlePrefetch);
      } else {
        setTimeout(idlePrefetch, 1500);
      }
    } catch {}

  }, []);

  return null;
};