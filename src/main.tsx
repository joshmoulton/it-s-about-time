
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeBrowserOptimizations, monitorPerformance } from './utils/browserOptimization'
import { initProductionSecurity } from './utils/productionSecurity'
import { optimizeForMobile } from './utils/mobileOptimization'
import { logger } from './utils/secureLogger'

// Initialize browser optimizations before rendering
initializeBrowserOptimizations();

// Initialize mobile optimizations
optimizeForMobile();

// Initialize production security measures
initProductionSecurity();
logger.info('🚀 Application initialized with security hardening');

// Monitor performance in development
if (import.meta.env.DEV) {
  monitorPerformance();
}

createRoot(document.getElementById("root")!).render(<App />);
