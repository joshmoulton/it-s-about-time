import { useEffect } from 'react';
import { smoothScrollTo } from '@/utils/smoothScroll';

// Section mappings - maps hash to actual element selector
const SECTION_MAPPINGS: Record<string, string> = {
  'services': '#services',
  'about': '#about', 
  'testimonials': '.kol-testimonial-section',
  'reviews': '.kol-testimonial-section',
  'pricing': '#pricing',
  'faq': '#faq',
  'contact': '#contact'
};

export const useHashNavigation = () => {
  useEffect(() => {
    // Handle initial hash on page load
    const handleInitialHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && SECTION_MAPPINGS[hash]) {
        // Small delay to ensure page is loaded
        setTimeout(() => {
          const element = document.querySelector(SECTION_MAPPINGS[hash]);
          if (element) {
            smoothScrollTo(element);
          }
        }, 100);
      }
    };

    // Handle hash changes (browser back/forward)
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && SECTION_MAPPINGS[hash]) {
        const element = document.querySelector(SECTION_MAPPINGS[hash]);
        if (element) {
          smoothScrollTo(element);
        }
      }
    };

    // Update hash when scrolling to sections
    const updateHashOnScroll = () => {
      const sections = Object.entries(SECTION_MAPPINGS);
      let currentSection = '';

      // Find which section is currently in view
      for (const [hash, selector] of sections) {
        const element = document.querySelector(selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Section is considered active if its top is within the viewport
          if (rect.top <= 200 && rect.bottom >= 200) {
            currentSection = hash;
            break;
          }
        }
      }

      // Update URL hash if section changed
      const currentHash = window.location.hash.replace('#', '');
      if (currentSection && currentSection !== currentHash) {
        // Use replaceState to avoid adding to browser history
        window.history.replaceState(null, '', `#${currentSection}`);
      } else if (!currentSection && currentHash) {
        // Clear hash when not in any section
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Throttled scroll handler
    let scrollTimeout: NodeJS.Timeout;
    const throttledScrollHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateHashOnScroll, 100);
    };

    // Initial setup
    handleInitialHash();

    // Add event listeners
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('scroll', throttledScrollHandler);
      clearTimeout(scrollTimeout);
    };
  }, []);
};