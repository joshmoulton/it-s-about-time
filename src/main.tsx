
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
