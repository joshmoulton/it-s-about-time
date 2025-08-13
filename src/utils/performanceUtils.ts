// Safe performance utilities for mobile optimization

export const preloadCriticalImages = (imageSrcs: string[]) => {
  imageSrcs.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

export const addResourceHints = (domains: string[]) => {
  domains.forEach(domain => {
    // Add preconnect for critical domains
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = domain;
    preconnect.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect);
  });
};

export const optimizeFontDisplay = () => {
  // Add font-display: swap to existing Google Fonts
  const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
  fontLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.includes('display=swap')) {
      const separator = href.includes('?') ? '&' : '?';
      link.setAttribute('href', `${href}${separator}display=swap`);
    }
  });
};

export const deferNonCriticalScripts = () => {
  // Defer non-critical third-party scripts
  const scripts = document.querySelectorAll('script[src]:not([data-critical])');
  scripts.forEach(script => {
    if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
      script.setAttribute('defer', '');
    }
  });
};

export const enableLayoutShiftPrevention = () => {
  // Add CSS to prevent layout shifts
  const style = document.createElement('style');
  style.textContent = `
    img { 
      height: auto; 
      width: 100%; 
      max-width: 100%; 
    }
    .loading-placeholder {
      background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground)/0.1) 50%, hsl(var(--muted)) 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
};