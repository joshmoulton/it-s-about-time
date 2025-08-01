
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { securityHeaders } from "./src/utils/productionBuild";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Apply security headers in development
    headers: mode === 'development' ? {
      ...securityHeaders,
      // More permissive CSP for development and Lovable preview
      'Content-Security-Policy': `
        default-src 'self'; 
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://cdn.gpteng.co https://*.lovable.dev https://*.lovable.app https://js.whop.com https://*.whop.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        connect-src 'self' https://wrvvlmevpvcenauglcyz.supabase.co wss://wrvvlmevpvcenauglcyz.supabase.co https://tcchfpgmwqawcjtwicek.supabase.co wss://tcchfpgmwqawcjtwicek.supabase.co https://*.lovable.dev https://*.lovable.app https://api.whop.com https://*.whop.com https://lovable-api.com;
        img-src 'self' data: https: blob:;
        font-src 'self' https://fonts.gstatic.com;
        frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://whop.com https://*.whop.com;
        frame-ancestors 'self' https://lovable.app https://*.lovable.app https://lovable.dev https://*.lovable.dev https://lovableproject.com https://*.lovableproject.com;
      `.replace(/\s+/g, ' ').trim()
    } : undefined,
  },
  plugins: [
    react(),
    // Enable component tagger in development for visual editor
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Production optimizations with cross-browser support
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    // Better browser compatibility
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    cssTarget: ['chrome87', 'firefox78', 'safari14', 'edge88'],
    // Force cache invalidation to fix stale asset references
    rollupOptions: {
      output: {
        // Add timestamp to ensure fresh builds
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          query: ['@tanstack/react-query'],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          
          // Admin components (only loaded when needed)
          admin: [
            './src/pages/Admin.tsx',
            './src/components/admin/dashboard/EnhancedDashboardOverview.tsx'
          ],
          
          // Dashboard components
          dashboard: [
            './src/pages/Dashboard.tsx',
            './src/components/dashboard/DashboardContent.tsx'
          ],
          
          // Large utility libraries
          utils: ['date-fns', 'clsx', 'class-variance-authority']
        }
      }
    },
    // Enable source maps only for production debugging
    sourcemap: mode === 'production' ? 'hidden' : true,
    // Polyfill for older browsers
    polyfillModulePreload: true,
    // CSS optimization
    css: {
      devSourcemap: true
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  // Enable HTTP/2 and compression with security headers
  preview: {
    headers: {
      ...securityHeaders,
      'Cache-Control': 'public, max-age=31536000, immutable',
      // Allow embedding in Lovable preview
      'Content-Security-Policy': `
        default-src 'self'; 
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://cdn.gpteng.co https://*.lovable.dev https://*.lovable.app https://js.whop.com https://*.whop.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        connect-src 'self' https://wrvvlmevpvcenauglcyz.supabase.co wss://wrvvlmevpvcenauglcyz.supabase.co https://tcchfpgmwqawcjtwicek.supabase.co wss://tcchfpgmwqawcjtwicek.supabase.co https://*.lovable.dev https://*.lovable.app https://api.whop.com https://*.whop.com https://lovable-api.com;
        img-src 'self' data: https: blob:;
        font-src 'self' https://fonts.gstatic.com;
        frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://whop.com https://*.whop.com;
        frame-ancestors 'self' https://lovable.app https://*.lovable.app https://lovable.dev https://*.lovable.dev https://lovableproject.com https://*.lovableproject.com;
      `.replace(/\s+/g, ' ').trim()
    }
  }
}));
