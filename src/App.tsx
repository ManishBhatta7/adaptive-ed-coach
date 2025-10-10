import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import AsyncErrorBoundary from "@/components/error/AsyncErrorBoundary";
import LoadingScreen from "@/components/loading/LoadingScreen";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LearningStylePage = lazy(() => import("./pages/LearningStylePage"));
const SubmitAssignment = lazy(() => import("./pages/SubmitAssignment"));
const ProgressPage = lazy(() => import("./pages/ProgressPage"));
const VoiceReadingPage = lazy(() => import("./pages/VoiceReadingPage"));
const ReportUploadPage = lazy(() => import("./pages/ReportUploadPage"));
const EssayCheckerPage = lazy(() => import("./pages/EssayCheckerPage"));
const AnswerSheetPage = lazy(() => import("./pages/AnswerSheetPage"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Classrooms = lazy(() => import("./pages/Classrooms"));
const Assignments = lazy(() => import("./pages/Assignments"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ContentManagementPage = lazy(() => import("./pages/ContentManagementPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const OCRPage = lazy(() => import("./pages/OCRPage"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (failureCount < 2) return true;
        console.error('Query failed after retries:', error);
        return false;
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
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
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/onboarding" element={<Onboarding />} />
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </AsyncErrorBoundary>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
