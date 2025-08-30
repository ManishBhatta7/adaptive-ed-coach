
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import AsyncErrorBoundary from "@/components/error/AsyncErrorBoundary";


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
import ContentManagementPage from "./pages/ContentManagementPage";
import AdminDashboard from "./pages/AdminDashboard";
import OCRPage from "./pages/OCRPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                } />
                <Route path="/signup" element={
                  <ProtectedRoute requireAuth={false}>
                    <Signup />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/learning-style" element={
                  <ProtectedRoute>
                    <LearningStylePage />
                  </ProtectedRoute>
                } />
                <Route path="/submit" element={
                  <ProtectedRoute>
                    <SubmitAssignment />
                  </ProtectedRoute>
                } />
                <Route path="/progress" element={
                  <ProtectedRoute>
                    <ProgressPage />
                  </ProtectedRoute>
                } />
                <Route path="/reading" element={
                  <ProtectedRoute>
                    <VoiceReadingPage />
                  </ProtectedRoute>
                } />
                <Route path="/report-upload" element={
                  <ProtectedRoute>
                    <ReportUploadPage />
                  </ProtectedRoute>
                } />
                <Route path="/essay-checker" element={
                  <ProtectedRoute>
                    <EssayCheckerPage />
                  </ProtectedRoute>
                } />
                <Route path="/answer-sheet" element={
                  <ProtectedRoute>
                    <AnswerSheetPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/classrooms" element={
                  <ProtectedRoute>
                    <Classrooms />
                  </ProtectedRoute>
                } />
                <Route path="/assignments" element={
                  <ProtectedRoute>
                    <Assignments />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/content-management" element={
                  <ProtectedRoute>
                    <ContentManagementPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/ocr" element={
                  <ProtectedRoute>
                    <OCRPage />
                  </ProtectedRoute>
                } />
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
