
import { Suspense, useEffect, useState } from "react";
import { initializePerformanceOptimizations } from "@/utils/performanceOptimizations";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EnhancedAuthProvider } from "@/contexts/EnhancedAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DeveloperProvider, DeveloperToggle } from "@/components/dev/DeveloperToggle";
import { updateAuthContextFromLocalStorage } from "@/utils/supabaseContext";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { SessionDetector } from "@/components/auth/SessionDetector";
import "@/utils/sessionHelper"; // Load debugging helpers
// Performance optimizations temporarily removed to fix modal issues
// import { optimizeFontDisplay, enableLayoutShiftPrevention } from "@/utils/performanceUtils";
import ProtectedRoute from "./components/ProtectedRoute";

// Critical components (loaded immediately)
import { Index } from "@/components/LazyComponents";

// Lazy loaded components
import {
  Dashboard,
  Newsletters,
  Videos,
  Articles,
  SentimentAnalysis,
  Courses,
  ChatHighlights,
  UpgradePage,
  AuthVerify,
  Admin,
} from "@/components/LazyComponents";

// Import the new auth callback page
import { AuthCallback } from "@/pages/AuthCallback";

// Static pages
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import LoadingScreen from "@/components/LoadingScreen";

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Skip loading if user has seen it this session
    if (sessionStorage.getItem('hasSeenLoading')) {
      setShowLoading(false);
    }
  }, []);

  // Initialize safe performance optimizations
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      initializePerformanceOptimizations();
      // Update Supabase context from localStorage on app start
      await updateAuthContextFromLocalStorage();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      {showLoading && (
        <LoadingScreen onLoadingComplete={() => setShowLoading(false)} />
      )}
      {!showLoading && (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BrowserRouter>
              <ThemeProvider>
                <AccessibilityProvider>
                    <Toaster />
                    <Sonner />
                    {/* All mobile performance optimizations disabled to fix modal issues */}
                     <DeveloperProvider>
                     <EnhancedAuthProvider>
                     <SessionDetector />
                     <DeveloperToggle />
                     <main id="main-content">
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                      <Route path="/" element={<Index />} />
                      
                      <Route path="/auth" element={
                        <Index />
                      } />
                      <Route path="/auth/verify" element={<AuthVerify />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route
                        path="/dashboard/*"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                <Route
                  path="/newsletters"
                  element={
                    <ProtectedRoute>
                      <Newsletters />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/videos"
                  element={
                    <ProtectedRoute>
                      <Videos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/articles"
                  element={
                    <ProtectedRoute>
                      <Articles />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/courses"
                  element={
                    <ProtectedRoute>
                      <Courses />
                    </ProtectedRoute>
                  }
                 />
                 <Route
                   path="/chat-highlights/*"
                   element={
                     <ProtectedRoute>
                       <ChatHighlights />
                     </ProtectedRoute>
                   }
                 />
                  <Route
                    path="/pricing"
                    element={<UpgradePage />}
                  />
                  <Route
                    path="/terms"
                    element={<TermsOfService />}
                  />
                  <Route
                    path="/privacy"
                    element={<PrivacyPolicy />}
                  />
                 <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  }
                 />
                 <Route
                   path="/sentiment-analysis"
                   element={
                     <ProtectedRoute>
                       <SentimentAnalysis />
                     </ProtectedRoute>
                   }
                 />
                         </Routes>
                       </Suspense>
                     </main>
                     </EnhancedAuthProvider>
                   </DeveloperProvider>
                 </AccessibilityProvider>
               </ThemeProvider>
             </BrowserRouter>
           </TooltipProvider>
         </QueryClientProvider>
       )}
     </>
   );
};

export default App;
