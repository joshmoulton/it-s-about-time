import { smoothScrollTo } from './smoothScroll';

// Section mappings - maps hash to actual element selector
const SECTION_MAPPINGS: Record<string, string> = {
  'services': '#services',
  'about': '#about', 
  'testimonials': '.kol-testimonial-section',
  'reviews': '.kol-testimonial-section',
  'farokh': '#farokh-testimonial',
  'pricing': '#pricing',
  'faq': '#faq',
  'contact': '#contact'
};

/**
 * Navigate to a section with hash URL update
 */
export const navigateToSection = (sectionHash: string) => {
  const selector = SECTION_MAPPINGS[sectionHash];
  if (!selector) return;

  const element = document.querySelector(selector);
  if (element) {
    // Update URL hash first
    window.history.pushState(null, '', `#${sectionHash}`);
    
    // Then smooth scroll to element
    smoothScrollTo(element);
  }
};

/**
 * Get the section hash for a given selector
 */
export const getSectionHash = (selector: string): string | null => {
  for (const [hash, mappedSelector] of Object.entries(SECTION_MAPPINGS)) {
    if (mappedSelector === selector) {
      return hash;
    }
  }
  return null;
};