
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EnhancedAuthProvider } from "@/contexts/EnhancedAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DeveloperProvider, DeveloperToggle } from "@/components/dev/DeveloperToggle";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";

import Newsletters from "./pages/Newsletters";
import Videos from "./pages/Videos";
import Articles from "./pages/Articles";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import Courses from "./pages/Courses";
import ChatHighlights from "./pages/ChatHighlights";

import UpgradePage from "./pages/UpgradePage";
import AuthVerify from "./pages/AuthVerify";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import WhopCallback from "./pages/WhopCallback";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ThemeProvider>
            <Toaster />
            <Sonner />
            <DeveloperProvider>
              <EnhancedAuthProvider>
                <DeveloperToggle />
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
<Route path="/auth/whop/callback" element={<WhopCallback />} />
                <Route path="/auth/verify" element={<AuthVerify />} />
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
                   element={
                     <ProtectedRoute>
                       <UpgradePage />
                     </ProtectedRoute>
                   }
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
              </EnhancedAuthProvider>
            </DeveloperProvider>
          </ThemeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
