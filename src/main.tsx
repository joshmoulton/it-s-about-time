
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeBrowserOptimizations, monitorPerformance } from './utils/browserOptimization'
import { initProductionSecurity } from './utils/productionSecurity'
import { optimizeForMobile } from './utils/mobileOptimization'
import { logger } from './utils/secureLogger'

// Initialize mobile optimizations immediately for performance
optimizeForMobile();

// Initialize browser optimizations
initializeBrowserOptimizations();

// Initialize production security measures
initProductionSecurity();
logger.info('🚀 Application initialized with security hardening');

// Monitor performance in development
if (import.meta.env.DEV) {
  monitorPerformance();
}

// Enhanced mobile performance
const container = document.getElementById("root");
if (!container) throw new Error('Root element not found');

// Create root with standard options
const root = createRoot(container);

root.render(<App />);
