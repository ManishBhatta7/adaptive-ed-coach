
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import AsyncErrorBoundary from "@/components/error/AsyncErrorBoundary";
import TestDataControls from "@/components/debug/TestDataControls";

// Import all page components
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import LearningStylePage from "./pages/LearningStylePage";
import SubmitAssignment from "./pages/SubmitAssignment";
import ProgressPage from "./pages/ProgressPage";
import VoiceReadingPage from "./pages/VoiceReadingPage";
import ReportUploadPage from "./pages/ReportUploadPage";
import EssayCheckerPage from "./pages/EssayCheckerPage";
import AnswerSheetPage from "./pages/AnswerSheetPage";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Classrooms from "./pages/Classrooms";
import Assignments from "./pages/Assignments";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (failureCount < 2) return true;
        console.error('Query failed after retries:', error);
        return false;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AsyncErrorBoundary>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {/* Global Test Data Controls - Only in development */}
            {import.meta.env.DEV && (
              <div className="fixed bottom-4 right-4 z-50 max-w-sm">
                <TestDataControls />
              </div>
            )}
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/learning-style" element={<LearningStylePage />} />
                <Route path="/submit" element={<SubmitAssignment />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/reading" element={<VoiceReadingPage />} />
                <Route path="/report-upload" element={<ReportUploadPage />} />
                <Route path="/essay-checker" element={<EssayCheckerPage />} />
                <Route path="/answer-sheet" element={<AnswerSheetPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/classrooms" element={<Classrooms />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/notifications" element={<Notifications />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </AsyncErrorBoundary>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
