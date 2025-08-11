
import { createRoot } from 'react-dom/client'
import { startTransition } from 'react'
import App from './App.tsx'
import './index.css'

import { initializeBrowserOptimizations, monitorPerformance } from './utils/browserOptimization'
import { initProductionSecurity } from './utils/productionSecurity'
import { optimizeForMobile } from './utils/mobileOptimization'
import { logger } from './utils/secureLogger'

// Critical performance setup - run immediately
const initializeApp = () => {
  // Add resource hints early (mobile perf)
  try {
    const addHint = (rel: string, href: string, as?: string, crossOrigin?: string) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (as) link.as = as;
      if (crossOrigin) link.crossOrigin = crossOrigin;
      document.head.appendChild(link);
    };
    // Supabase API preconnect/dns-prefetch
    addHint('preconnect', 'https://wrvvlmevpvcenauglcyz.supabase.co', undefined, 'anonymous');
    addHint('dns-prefetch', 'https://wrvvlmevpvcenauglcyz.supabase.co');
  } catch {}

  // Initialize mobile optimizations for immediate performance boost
  optimizeForMobile();
  
  // Initialize browser optimizations
  initializeBrowserOptimizations();
  
  // Initialize production security measures
  initProductionSecurity();
  
  // Performance monitoring in development only
  if (import.meta.env.DEV) {
    monitorPerformance();
  }

  // Defer non-critical analytics (PostHog) to idle/load
  const loadAnalytics = () => import('./utils/postHogWrapper').catch(() => {});
  const w = window as Window & typeof globalThis;
  if ('requestIdleCallback' in w) {
    (w as any).requestIdleCallback(loadAnalytics);
  } else {
    w.addEventListener('load', () => loadAnalytics(), { once: true });
  }
  
  logger.info('🚀 App initialized with performance optimizations');
};

// Run initialization immediately
initializeApp();

// Unregister service workers only on preview/localhost to avoid stale caches during development
if ('serviceWorker' in navigator && (location.hostname.includes('id-preview--') || location.hostname === 'localhost')) {
  try {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  } catch {}
}

// Get root container
const container = document.getElementById("root");
if (!container) throw new Error('Root element not found');

// Create root with performance optimizations
const root = createRoot(container, {
  // Enable concurrent features for better performance
  identifierPrefix: 'ww-'
});

// Use startTransition for better perceived performance
startTransition(() => {
  root.render(<App />);
});
