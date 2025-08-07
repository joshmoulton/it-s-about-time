// Performance optimization utilities for mobile
export const optimizeForMobile = () => {
  // Reduce motion for battery savings
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
  }

  // Optimize scroll performance
  if ('CSS' in window && 'supports' in window.CSS) {
    if (window.CSS.supports('scroll-behavior', 'smooth')) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }

  // Passive event listeners for better scroll performance
  let ticking = false;
  const updateScrollPosition = () => {
    ticking = false;
    // Update scroll-dependent elements here
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollPosition);
      ticking = true;
    }
  }, { passive: true });
};

// Preload critical images
export const preloadCriticalImages = () => {
  const criticalImages = [
    'https://wrvvlmevpvcenauglcyz.supabase.co/storage/v1/object/public/assets/Property%201=Black%20(3).png',
    '/lovable-uploads/a8eaa39b-22e5-4a3c-a288-fe43b8619eab.png'
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
  });
};

// Optimize font loading
export const optimizeFontLoading = () => {
  if ('fonts' in document) {
    // Load critical fonts first
    const criticalFonts = [
      new FontFace('Merriweather', 'url(https://fonts.gstatic.com/s/merriweather/...)', {
        display: 'swap'
      }),
      new FontFace('Montserrat', 'url(https://fonts.gstatic.com/s/montserrat/...)', {
        display: 'swap'
      })
    ];

    criticalFonts.forEach(font => {
      document.fonts.add(font);
      font.load();
    });
  }
};

// Optimize images with intersection observer
export const lazyLoadImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

// Critical resource hints
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossorigin: true },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.crossorigin) link.crossOrigin = '';
    document.head.appendChild(link);
  });
};